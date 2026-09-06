import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevFlow — AI-Powered Issue Management",
  description:
    "AI-powered engineering project management platform with real-time issue tracking, Kanban boards, sprint management, and intelligent issue analysis.",
  keywords: [
    "project management",
    "issue tracking",
    "AI",
    "kanban",
    "sprint",
    "developer tools",
  ],
};

import { AuthProvider } from "../context/AuthContext";
import { NetworkProvider } from "../context/NetworkContext";
import { ThemeProvider } from "../context/ThemeContext";
import { Toaster } from "react-hot-toast";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('preferredTheme');
                  var isDark = stored === 'dark' || ((!stored || stored === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <NetworkProvider>
            <AuthProvider>{children}</AuthProvider>
          </NetworkProvider>
        </ThemeProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 5000,
            style: {
              background: "#0f172a",
              color: "#f8fafc",
              border: "1px solid #334155",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
              borderRadius: "1rem",
              padding: "12px 20px",
              fontSize: "0.875rem",
              fontWeight: 500,
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#0f172a",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#0f172a",
              },
            },
          }}
        />
        <SpeedInsights />
      </body>
    </html>
  );
}
