/**
 * Authenticated fetch wrapper that attaches Firebase ID token or JWT
 * and handles token refresh automatically with timeout and error resilience.
 *
 * Error contract:
 *   - NetworkError  → thrown when the request could not reach the server
 *                     (no internet, timeout, DNS failure, API unreachable)
 *   - Error         → thrown for HTTP-level failures (401, 403, 404, 500, etc.)
 *                     These are NEVER classified as offline/network problems.
 */
import { auth } from "./firebase";
import { NetworkError, classifyFetchError } from "./network-error";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");

// Re-export so consumers can import from one place
export { NetworkError, classifyFetchError, isNetworkError } from "./network-error";
export type { NetworkErrorKind } from "./network-error";

let inMemoryAccessToken: string | null = null;

export function setInMemoryAccessToken(token: string | null) {
  inMemoryAccessToken = token;
  // Security: Tokens are only stored in-memory and httpOnly cookies.
  // Never persist JWTs to localStorage/sessionStorage (XSS-extractable).
}

export function getInMemoryAccessToken(): string | null {
  return inMemoryAccessToken;
}

export interface FetchWithAuthOptions extends RequestInit {
  timeoutMs?: number;
  maxRetries?: number;
  idempotencyKey?: string;
}

export async function fetchWithAuth<T = any>(
  url: string,
  options: FetchWithAuthOptions = {}
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const isSafeIdempotent = method === "GET" || method === "HEAD";
  const maxRetries = typeof options.maxRetries === "number" ? options.maxRetries : (isSafeIdempotent ? 2 : 0);
  const timeoutMs = options.timeoutMs || 30000;

  let attempt = 0;

  while (true) {
    attempt++;

    // 1. In-memory or session-stored access token
    let token: string | null = getInMemoryAccessToken();

    // 2. Prefer fresh Firebase ID token if available
    if (!token) {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          token = await currentUser.getIdToken();
          if (token) setInMemoryAccessToken(token);
        }
      } catch {
        // Firebase not available
      }
    }

    // 3. Proactive refresh: If token is still missing, try cookie-based refresh
    // Security: Refresh tokens are only transported via httpOnly cookies.
    if (!token) {
      try {
        const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.data?.accessToken) {
            token = refreshData.data.accessToken;
            setInMemoryAccessToken(token);
          }
        }
      } catch (refreshErr) {
        console.warn("Proactive token refresh error:", refreshErr);
      }
    }

    const headers: Record<string, string> = {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (options.idempotencyKey) {
      headers["Idempotency-Key"] = options.idempotencyKey;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      let res = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
        signal: options.signal || controller.signal,
      });

      // If 401, try to refresh the token once
      if (res.status === 401) {
        try {
          const currentUser = auth.currentUser;
          if (currentUser) {
            const freshToken = await currentUser.getIdToken(true);
            headers["Authorization"] = `Bearer ${freshToken}`;
            setInMemoryAccessToken(freshToken);
            res = await fetch(url, {
              ...options,
              headers,
              credentials: "include",
              signal: options.signal || controller.signal,
            });
            if (res.ok || res.status !== 401) {
              const data = await res.json().catch(() => ({}));
              if (!res.ok) throw new Error(data.message || data.error || `Request failed with status ${res.status}`);
              return data;
            }
          }
        } catch {
          // Firebase refresh failed
        }

        // Security: Refresh tokens are sent via httpOnly cookies only (credentials: "include").
        try {
          const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            if (refreshData.data?.accessToken) {
              setInMemoryAccessToken(refreshData.data.accessToken);
              headers["Authorization"] = `Bearer ${refreshData.data.accessToken}`;

              res = await fetch(url, {
                ...options,
                headers,
                credentials: "include",
                signal: options.signal || controller.signal,
              });
            }
          } else {
            setInMemoryAccessToken(null);
          }
        } catch {
          setInMemoryAccessToken(null);
        }
      }

      // Check for transient server errors (502, 503, 504) that can be safely retried for idempotent requests
      if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt <= maxRetries && isSafeIdempotent) {
        clearTimeout(timeoutId);
        const backoff = Math.min(1000 * Math.pow(2, attempt - 1) + Math.random() * 400, 6000);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || data.error || `Request failed with status ${res.status}`);
      }

      return data;
    } catch (err: any) {
      // ── Classify the raw error ──────────────────────────────────────────
      // classifyFetchError returns a NetworkError only for genuine connectivity
      // failures (abort/timeout, failed to fetch, network unreachable).
      // HTTP errors (4xx/5xx) will have already been thrown as regular Errors
      // above and will NOT match, so they fall through as regular errors here.
      const networkErr = classifyFetchError(err);

      if (networkErr) {
        // Only retry transient network failures for idempotent calls
        if (attempt <= maxRetries && isSafeIdempotent) {
          clearTimeout(timeoutId);
          const backoff = Math.min(1000 * Math.pow(2, attempt - 1) + Math.random() * 400, 6000);
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }

        // Notify the NetworkProvider so the banner/modal can appear
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("devflow:network_error", {
              detail: { kind: networkErr.kind, url },
            })
          );
        }

        // Re-throw as a typed NetworkError so error boundaries can differentiate
        throw networkErr;
      }

      // Non-network error (already a plain Error from an HTTP response): re-throw as-is
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
