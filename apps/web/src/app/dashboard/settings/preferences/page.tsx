"use client";

import React from "react";

import Link from "next/link";
import toast from "react-hot-toast";
import { workspaceApi, projectApi, githubApi, notificationApi, billingApi, authApi } from "../../../../lib/api";

import {
  User as UserIcon, Settings as SettingsIcon, Users as UsersIcon, Sliders, LayoutDashboard,
  Columns3, Check, AlertCircle, Sparkles, Save, Clock, Github, GitBranch, GitPullRequest,
  RefreshCw, Link2, Unlink, ExternalLink, Key, ShieldCheck, FolderGit2, Bell, CreditCard,
  HardDrive, Zap, ArrowRight, Shield, Trash2, Copy, Link as LinkIcon, UserPlus, Info, Lock,
  AlertTriangle, X, Smartphone, Monitor, KeyRound, Volume2, Moon, Sun, Laptop, Globe,
  Calendar, BadgeCheck, QrCode, Download, FileText
} from "lucide-react";


import { useSettingsContext } from "../SettingsContext";
import { useTheme } from "@/context/ThemeContext";
import { TIMEZONES, AVATAR_GRADIENTS, DATE_FORMAT_OPTIONS, RBAC_ROLE_PERMISSIONS_MATRIX, ROLES } from "../constants";

export default function PreferencesTab() {
  const {
    handlePreferencesSubmit, preferences, saving, setPreferences, workspace
  } = useSettingsContext();
  const { setTheme } = useTheme();

  return (
    <form onSubmit={handlePreferencesSubmit} className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Application Preferences
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Customize your default start-up page, color theme, and localized time display
                </p>
              </div>

              {/* Theme Selector */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Interface Appearance Theme
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {[
                    { id: "light", label: "Light Mode", icon: Sun, desc: "Clean white surface with crisp borders" },
                    { id: "dark", label: "Dark Mode", icon: Moon, desc: "Deep slate background for low-light coding" },
                    { id: "system", label: "System Default", icon: Monitor, desc: "Synchronize automatically with OS settings" },
                  ].map((th) => {
                    const isSelected = preferences.theme === th.id;
                    const Icon = th.icon;
                    return (
                      <div
                        key={th.id}
                        onClick={() => {
                          setPreferences({ ...preferences, theme: th.id as any });
                          setTheme(th.id as any);
                        }}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "bg-indigo-50/60 dark:bg-indigo-950/60 border-indigo-600 shadow-xs"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"}`} />
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">{th.label}</h4>
                          </div>
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300 dark:border-slate-600"
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{th.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-slate-200 w-full" />

              {/* Default View Selector */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Default View on Application Load
                </label>
                <p className="text-xs text-slate-500">
                  Choose which workspace screen opens automatically when you sign in.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Option 1: Dashboard */}
                  <div
                    onClick={() => setPreferences({ ...preferences, defaultView: "dashboard" })}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      preferences.defaultView === "dashboard"
                        ? "bg-indigo-50/60 border-indigo-600 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          preferences.defaultView === "dashboard"
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          <LayoutDashboard className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Dashboard Overview</h4>
                          <span className="font-mono text-[10px] text-slate-500">/dashboard</span>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        preferences.defaultView === "dashboard"
                          ? "border-indigo-600 bg-indigo-600"
                          : "border-slate-300"
                      }`}>
                        {preferences.defaultView === "dashboard" && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      KPI cards, sprint burndown velocity charts, my assignments queue, and activity stream.
                    </p>
                  </div>

                  {/* Option 2: Kanban */}
                  <div
                    onClick={() => setPreferences({ ...preferences, defaultView: "kanban" })}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      preferences.defaultView === "kanban"
                        ? "bg-indigo-50/60 border-indigo-600 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          preferences.defaultView === "kanban"
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          <Columns3 className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Kanban Board</h4>
                          <span className="font-mono text-[10px] text-slate-500">/dashboard/board</span>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        preferences.defaultView === "kanban"
                          ? "border-indigo-600 bg-indigo-600"
                          : "border-slate-300"
                      }`}>
                        {preferences.defaultView === "kanban" && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Interactive 5-column drag-and-drop sprint board with team capacity meters.
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-200 w-full" />

              {/* Preferred Date Format */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Preferred Date Format
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {DATE_FORMAT_OPTIONS.map((opt) => {
                    const isSelected = preferences.dateFormat === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setPreferences({ ...preferences, dateFormat: opt.id as any })}
                        className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-600 text-indigo-900 shadow-2xs"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-slate-900">
                              {opt.label}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">
                                Active
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {opt.description}
                          </span>
                        </div>

                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sound & Notifications */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Audio &amp; Feedback
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Sound Effects on Issue Completion</span>
                      <span className="text-[11px] text-slate-500 block">Play a subtle audio cue when moving tasks to Done or merging PRs</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.soundEffects}
                    onChange={(e) => setPreferences({ ...preferences, soundEffects: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </label>
              </div>

              {/* Live Preview Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-2xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">
                      Live Preview Example
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Issue SS-1 created on{" "}
                      <span className="text-indigo-600 font-bold">
                        {preferences.dateFormat === "YYYY-MM-DD"
                          ? "2026-08-20"
                          : preferences.dateFormat === "MM/DD/YYYY"
                          ? "08/20/2026"
                          : preferences.dateFormat === "DD/MM/YYYY"
                          ? "20/08/2026"
                          : "Aug 20, 2026"}
                      </span>
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white text-indigo-700 border border-indigo-200 shadow-2xs">
                  Landing: {preferences.defaultView === "kanban" ? "Kanban Board" : "Dashboard Overview"}
                </span>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 px-6 rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving Preferences..." : "Save Preferences"}</span>
                </button>
              </div>
            </form>
  );
}
