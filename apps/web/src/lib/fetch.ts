/**
 * Authenticated fetch wrapper that attaches Firebase ID token or JWT
 * and handles token refresh automatically with timeout and error resilience.
 */
import { auth } from "./firebase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

let inMemoryAccessToken: string | null = null;

export function setInMemoryAccessToken(token: string | null) {
  inMemoryAccessToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      sessionStorage.setItem("accessToken", token);
      localStorage.setItem("accessToken", token);
    } else {
      sessionStorage.removeItem("accessToken");
      localStorage.removeItem("accessToken");
    }
  }
}

export function getInMemoryAccessToken(): string | null {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  if (typeof window !== "undefined") {
    const stored = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
    if (stored) {
      inMemoryAccessToken = stored;
      return stored;
    }
  }
  return null;
}

export async function fetchWithAuth<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // 1. In-memory or session-stored access token
  let token: string | null = getInMemoryAccessToken();

  // 2. Check localStorage if in-memory is missing
  if (!token && typeof window !== "undefined") {
    token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || null;
    if (token) setInMemoryAccessToken(token);
  }

  // 3. Prefer fresh Firebase ID token if available
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

  // 4. Proactive refresh: If token is still missing, try refreshing via stored refreshToken
  if (!token && typeof window !== "undefined") {
    const storedRefreshToken = localStorage.getItem("refreshToken");
    if (storedRefreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
          credentials: "include",
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.data?.accessToken) {
            token = refreshData.data.accessToken;
            setInMemoryAccessToken(token);
            if (refreshData.data?.refreshToken) {
              localStorage.setItem("refreshToken", refreshData.data.refreshToken);
            }
          }
        }
      } catch (refreshErr) {
        console.warn("Proactive token refresh error:", refreshErr);
      }
    }
  }

  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Create AbortController with 15 second timeout for safety against hung connections
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    let res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
      signal: options.signal || controller.signal,
    });

    // If 401, try to refresh the token
    if (res.status === 401) {
      // Try getting a fresh Firebase token first
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

      // Fallback: try JWT refresh endpoint
      const storedRefreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
      if (storedRefreshToken) {
        const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
          credentials: "include",
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.data?.accessToken) {
            setInMemoryAccessToken(refreshData.data.accessToken);
            if (refreshData.data?.refreshToken && typeof window !== "undefined") {
              localStorage.setItem("refreshToken", refreshData.data.refreshToken);
            }
            headers["Authorization"] = `Bearer ${refreshData.data.accessToken}`;

            // Retry original request
            res = await fetch(url, {
              ...options,
              headers,
              credentials: "include",
            });
          }
        } else {
          setInMemoryAccessToken(null);
        }
      }
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || data.error || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please check your network connection.");
    }
    if (err.name === "TypeError" && err.message?.includes("fetch")) {
      console.error(`[DevFlow API Error] Failed to reach backend at: ${url}`, err);
      if (url.includes("localhost:4000")) {
        throw new Error(
          "Cannot reach API backend (attempted localhost:4000). Please set NEXT_PUBLIC_API_URL in your Vercel project environment variables and trigger a redeploy."
        );
      }
      throw new Error(
        `Unable to reach backend service at ${url}. Please verify your backend is active and CORS is permitted.`
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
