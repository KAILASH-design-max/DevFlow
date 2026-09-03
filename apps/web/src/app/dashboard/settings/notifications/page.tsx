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

export default function NotificationsTab() {
  const {
    handleSaveNotifPrefs, notifPrefs, savingNotifs, setNotifPrefs, user
  } = useSettingsContext();

  return (
    <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-indigo-600" />
                    Notification Rules &amp; Event Triggers
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure real-time in-app alerts, team dispatch rules, and digest cadences
                  </p>
                </div>
                <Link
                  href="/dashboard/notifications"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors shadow-2xs self-start"
                >
                  <span>Open Notification Center</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <form onSubmit={handleSaveNotifPrefs} className="space-y-4 text-sm">
                <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <div>
                    <span className="text-slate-900 font-semibold block text-xs">Direct Issue Assignments</span>
                    <span className="text-[11px] text-slate-500 block">Receive instant in-app and push alerts when an issue is assigned to you</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.assignmentAlerts}
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, assignmentAlerts: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <div>
                    <span className="text-slate-900 font-semibold block text-xs">@Mentions &amp; Discussion Replies</span>
                    <span className="text-[11px] text-slate-500 block">Alert when mentioned by name in markdown issue comments or PR threads</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.mentionAlerts}
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, mentionAlerts: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <div>
                    <span className="text-slate-900 font-semibold block text-xs">Pull Requests &amp; Branch Merges</span>
                    <span className="text-[11px] text-slate-500 block">Notify when linked GitHub PRs are created, approved, or merged into main</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.prAlerts}
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, prAlerts: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <div>
                    <span className="text-slate-900 font-semibold block text-xs">SLA Breach &amp; Risk Escalations</span>
                    <span className="text-[11px] text-slate-500 block">Immediate high-priority escalation when critical issues breach SLA time limits</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.slaAlerts}
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, slaAlerts: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <div>
                    <span className="text-slate-900 font-semibold block text-xs">Email Activity Alerts</span>
                    <span className="text-[11px] text-slate-500 block">Send instant email notifications to {user?.email || "your registered email"}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.emailAlerts}
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, emailAlerts: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <div>
                    <span className="text-slate-900 font-semibold block text-xs">Weekly Engineering Digest</span>
                    <span className="text-[11px] text-slate-500 block">Summary of closed issues, sprint velocity, and MTTR performance every Monday</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.weeklyDigest}
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, weeklyDigest: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </label>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingNotifs}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingNotifs ? "Saving Rules..." : "Save Notification Preferences"}</span>
                  </button>
                </div>
              </form>
            </div>
  );
}
