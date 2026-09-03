import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans selection:bg-brand-500/30 selection:text-brand-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-neutral-900/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-neutral-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to DevFlow</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-white tracking-wider">
              DEVFLOW
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-6 py-12 md:py-20 lg:py-24">
        <article className="prose prose-invert prose-neutral max-w-none prose-headings:font-semibold prose-h1:text-4xl prose-h1:tracking-tight prose-h2:text-2xl prose-h2:mt-12 prose-a:text-brand-400 hover:prose-a:text-brand-300">
          {children}
        </article>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 bg-neutral-900 py-12 text-center text-sm text-neutral-500">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-4 px-6 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} DevFlow Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/legal/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/legal/safety" className="hover:text-white transition-colors">Safety</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
