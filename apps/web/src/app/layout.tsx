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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
