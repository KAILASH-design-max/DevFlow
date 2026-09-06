"use client";

/**
 * global-error.tsx — Next.js global error boundary
 *
 * This catches errors that crash the root layout itself, which means
 * the full HTML shell (including <html> and <body>) must be rendered here.
 *
 * This is a last-resort fallback. Most errors will be caught by the
 * route-level error.tsx boundary before reaching this point.
 *
 * SECURITY: Never exposes raw error details, stack traces, or digests.
 */

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Only log — never display — raw error info
  React.useEffect(() => {
    console.error("[DevFlow] Global error caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Something went wrong — DevFlow</title>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            min-height: 100vh;
            background: #f8fafc;
            color: #0f172a;
            font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }
          .card {
            max-width: 420px;
            width: 100%;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0;
          }
          .icon-wrap {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: #fee2e2;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
          }
          h1 {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.02em;
            color: #0f172a;
            margin-bottom: 12px;
            line-height: 1.3;
          }
          p {
            font-size: 15px;
            color: #64748b;
            line-height: 1.6;
            max-width: 320px;
            margin-bottom: 28px;
          }
          button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 36px;
            border-radius: 9999px;
            background: #355bdc;
            color: #ffffff;
            font-size: 15px;
            font-weight: 500;
            border: none;
            cursor: pointer;
            transition: background 0.15s;
          }
          button:hover { background: #2849be; }
          button:active { background: #1f3aa0; transform: scale(0.98); }
          button:focus-visible {
            outline: 2px solid #355bdc;
            outline-offset: 3px;
          }
        `}</style>
      </head>
      <body>
        <div className="card" role="alert" aria-live="assertive">
          {/* Simple SVG fallback — no external dependencies */}
          <div className="icon-wrap" aria-hidden="true">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1>Something went wrong</h1>

          <p>
            DevFlow encountered an unexpected error. Please try again, or refresh the page.
          </p>

          <button onClick={reset} aria-label="Try again">
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
