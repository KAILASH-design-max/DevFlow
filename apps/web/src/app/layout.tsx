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
import { Toaster } from "react-hot-toast";

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
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
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
      </body>
    </html>
  );
}
