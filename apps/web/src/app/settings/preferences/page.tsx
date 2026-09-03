"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPreferencesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/settings?tab=preferences");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-600 text-xs font-semibold">
      Redirecting to Preferences Settings...
    </div>
  );
}
