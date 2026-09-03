/**
 * Authenticated fetch wrapper that attaches Firebase ID token or JWT
 * and handles token refresh automatically with timeout and error resilience.
 */
import { auth } from "./firebase";

export async function fetchWithAuth<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // Prefer fresh Firebase ID token; fall back to stored JWT
  let token: string | null = null;
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      token = await currentUser.getIdToken();
    }
  } catch {
    // Firebase not available
  }

  if (!token && typeof window !== "undefined") {
    token = localStorage.getItem("accessToken");
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
    if (res.status === 401 && token) {
      // Try getting a fresh Firebase token first
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const freshToken = await currentUser.getIdToken(true);
          headers["Authorization"] = `Bearer ${freshToken}`;
          res = await fetch(url, {
            ...options,
            headers,
            credentials: "include",
          });
          if (res.ok || res.status !== 401) {
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || `Request failed with status ${res.status}`);
            return data;
          }
        }
      } catch {
        // Firebase refresh failed
      }

      // Fallback: try JWT refresh endpoint
      const refreshRes = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.data?.accessToken) {
          localStorage.setItem("accessToken", refreshData.data.accessToken);
          headers["Authorization"] = `Bearer ${refreshData.data.accessToken}`;

          // Retry original request
          res = await fetch(url, {
            ...options,
            headers,
            credentials: "include",
          });
        }
      } else {
        // Refresh failed — logout
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        if (typeof window !== "undefined" && window.location.pathname !== "/") {
          window.location.href = "/";
        }
        throw new Error("Session expired. Please sign in again.");
      }
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please check your network connection.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
