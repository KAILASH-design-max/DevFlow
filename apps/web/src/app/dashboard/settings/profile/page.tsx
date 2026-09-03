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
import { TIMEZONES, AVATAR_GRADIENTS, DATE_FORMAT_OPTIONS, RBAC_ROLE_PERMISSIONS_MATRIX, ROLES } from "../constants";

export default function ProfileTab() {
  const {
    handleProfileSubmit, profileForm, saving, setProfileForm
  } = useSettingsContext();

  return (
    <form onSubmit={handleProfileSubmit} className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-indigo-600" />
                  Personal Profile &amp; Identity
                </h3>
                <p className="text-xs text-slate-500">
                  Manage your public avatar, name, engineering role, and localized timezone
                </p>
              </div>

              {/* Avatar & Identity */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Profile Avatar
                </h4>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-2xl font-black text-white shadow-md shrink-0">
                    {profileForm.name ? profileForm.name[0].toUpperCase() : "U"}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">
                      {profileForm.name || "Alice Chen"}
                    </h5>
                    <p className="text-xs text-slate-500 font-mono">
                      {profileForm.email || "alice@devflow.io"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-900 outline-none transition-colors"
                      placeholder="Alice Chen"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      value={profileForm.email}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-500 cursor-not-allowed outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Primary email is managed via authentication provider
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Engineering Role / Job Title
                    </label>
                    <input
                      type="text"
                      value={profileForm.title}
                      onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-900 outline-none transition-colors"
                      placeholder="e.g. Senior Staff Backend Engineer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Timezone
                    </label>
                    <select
                      value={profileForm.timezone}
                      onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-900 outline-none transition-colors"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Bio &amp; Status Message
                  </label>
                  <textarea
                    rows={3}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-900 outline-none transition-colors"
                    placeholder="Briefly describe what you are building or your team responsibilities"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    GitHub Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">@</span>
                    <input
                      type="text"
                      value={profileForm.githubUsername}
                      onChange={(e) => setProfileForm({ ...profileForm, githubUsername: e.target.value.replace(/^@/, "") })}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-lg pl-7 pr-3 py-2.5 text-xs text-slate-900 font-mono outline-none transition-colors"
                      placeholder="alice-chen"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${profileForm.avatarGradient} flex items-center justify-center text-sm font-bold text-white shadow-2xs`}>
                    {profileForm.name ? profileForm.name[0].toUpperCase() : "U"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{profileForm.name || "User"}</span>
                      {profileForm.githubUsername && (
                        <span className="text-[10px] font-mono text-slate-500">@{profileForm.githubUsername}</span>
                      )}
                    </div>
                    <span className="text-[11px] text-indigo-600 font-medium block">
                      {profileForm.title} &bull; {profileForm.timezone.split("/")[1]?.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Account
                </span>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 px-6 rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving Changes..." : "Save Profile"}</span>
                </button>
              </div>
            </form>
  );
}
