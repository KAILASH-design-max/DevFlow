"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  UserIcon,
  ShieldCheck,
  Sliders,
  SettingsIcon,
  Shield,
  Scale,
  Bell,
  CreditCard,
  AlertCircle,
  Check,
} from "lucide-react";
import { SettingsProvider, useSettingsContext } from "./SettingsContext";

const tabs = [
  { id: "profile", label: "My Profile", icon: UserIcon },
  { id: "security", label: "Security & 2FA", icon: ShieldCheck },
  { id: "preferences", label: "App Preferences", icon: Sliders },
  { id: "workspace", label: "Workspace", icon: SettingsIcon },
  { id: "privacy", label: "Privacy Policy", icon: Shield },
  { id: "terms", label: "Terms & Conditions", icon: Scale },
];

function SettingsLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { error, success } = useSettingsContext();

  const currentTab = pathname.split("/").pop() || "profile";

  useEffect(() => {
    if (pathname === "/dashboard/settings") {
      router.replace("/dashboard/settings/profile");
    }
  }, [pathname, router]);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto text-slate-900 p-6">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Account &amp; Workspace Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal profile, 2FA security, workspace organization, legal compliance, and application preferences
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium animate-fade-in">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-1 flex flex-col gap-1 bg-white rounded-xl p-2 border border-slate-200 shadow-2xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={`/dashboard/settings/${tab.id}`}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="lg:col-span-3 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <SettingsLayoutContent>{children}</SettingsLayoutContent>
    </SettingsProvider>
  );
}
