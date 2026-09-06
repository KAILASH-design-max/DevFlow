/**
 * Security utilities for DevFlow Web Application
 */

/**
 * Validates that a redirect URL is safe to navigate to, preventing open redirects.
 * Only relative paths starting with a single '/' are permitted.
 * Double slashes (//evil.com), backslashes (/\\evil.com), control characters, and protocols are rejected.
 */
export function getSafeRedirectUrl(target: string | null | undefined, fallback: string = "/dashboard"): string {
  if (!target || typeof target !== "string") {
    return fallback;
  }
  const trimmed = target.trim();
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.startsWith("/\\") &&
    !trimmed.includes("\n") &&
    !trimmed.includes("\r")
  ) {
    return trimmed;
  }
  return fallback;
}
