/**
 * NetworkError — A typed error class for network/connectivity failures.
 *
 * This MUST be used only when the request could not reach the server
 * due to: no internet, network unreachable, request timed out, or CORS abort.
 *
 * It must NOT be thrown for HTTP error responses like 401, 403, 404, 500.
 * Those are server responses and should use regular Error or HttpError.
 *
 * Usage in error boundaries and fallback components:
 *   if (error instanceof NetworkError) → show offline / connectivity page
 *   else → show generic error page (may include server messages)
 */

export type NetworkErrorKind =
  | "OFFLINE"       // Browser navigator.onLine === false
  | "TIMEOUT"       // Request exceeded timeout threshold
  | "UNREACHABLE"   // Network fetch failed (ECONNREFUSED, DNS failure, etc.)
  | "API_DOWN";     // Browser is online but our API health check fails

export class NetworkError extends Error {
  readonly kind: NetworkErrorKind;
  readonly isNetworkError = true as const;

  constructor(kind: NetworkErrorKind, message?: string) {
    super(
      message ??
        (kind === "OFFLINE"
          ? "No Internet connection. Make sure that Wi-Fi or mobile data is turned on, then try again."
          : kind === "TIMEOUT"
          ? "Request timed out. Please check your network connection."
          : kind === "API_DOWN"
          ? "DevFlow servers are temporarily unreachable. Please try again shortly."
          : "Unable to reach the server. Please check your internet connection.")
    );
    this.name = "NetworkError";
    this.kind = kind;

    // Maintain proper prototype chain (required for `instanceof` checks in bundlers)
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Returns true if an error is a genuine network connectivity failure
 * that should render the offline/network-error page.
 *
 * Returns false for HTTP errors (401, 403, 404, 500) — those are server responses,
 * not connectivity problems.
 */
export function isNetworkError(err: unknown): err is NetworkError {
  if (err instanceof NetworkError) return true;
  if (err instanceof Error) {
    // Duck-typing fallback for cross-realm or serialised errors
    return (err as any).isNetworkError === true;
  }
  return false;
}

/**
 * Classifies a raw caught error into a NetworkError or returns null
 * if the error is actually an HTTP response error.
 *
 * Handles:
 * - AbortError (timeout)
 * - TypeError "Failed to fetch" (no connection)
 * - TypeError "NetworkError" (network layer failure)
 * - Already-classified NetworkError instances
 */
export function classifyFetchError(err: unknown): NetworkError | null {
  if (err instanceof NetworkError) return err;

  if (err instanceof Error) {
    if (err.name === "AbortError") {
      return new NetworkError("TIMEOUT", err.message);
    }

    const msg = err.message?.toLowerCase() ?? "";
    const isTypeFetch =
      err.name === "TypeError" &&
      (msg.includes("failed to fetch") ||
        msg.includes("networkerror") ||
        msg.includes("network request failed") ||
        msg.includes("load failed") || // Safari
        msg.includes("fetch"));

    if (isTypeFetch) {
      // Check browser online status to give a more specific kind
      const isOnline =
        typeof navigator !== "undefined" ? navigator.onLine : true;
      return new NetworkError(
        isOnline ? "UNREACHABLE" : "OFFLINE",
        err.message
      );
    }
  }

  return null;
}
