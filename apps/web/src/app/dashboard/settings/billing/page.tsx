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

export default function BillingTab() {
  const {
    subscription, usage
  } = useSettingsContext();

  return (
    <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    Billing &amp; Workspace Subscription
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manage tier pricing, track usage quotas, and download invoices
                  </p>
                </div>

                <Link
                  href="/dashboard/billing"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs self-start"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Manage Plans &amp; Checkout</span>
                </Link>
              </div>

              {/* Active Plan Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-300">
                    Current Active Tier
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active &amp; In Good Standing
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <h4 className="text-2xl font-extrabold tracking-tight">
                      {subscription?.tier === "FREE" ? "Starter Plan" : subscription?.tier === "ENTERPRISE" ? "Enterprise AI" : "Team Pro Plan"}
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Billed {subscription?.interval?.toLowerCase() || "monthly"} • Auto-renews next cycle
                    </p>
                  </div>
                  <span className="text-xl font-bold font-mono text-indigo-300">
                    {subscription?.tier === "FREE" ? "$0" : subscription?.tier === "ENTERPRISE" ? "$49" : "$19"}/mo
                  </span>
                </div>
              </div>

              {/* Usage Quotas Summary */}
              {usage && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <UsersIcon className="w-4 h-4 text-blue-600" /> Team Seats
                    </span>
                    <p className="text-sm font-bold text-slate-900">
                      {usage.seatsUsed} / {usage.seatsLimit === -1 ? "Unlimited" : usage.seatsLimit}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" /> Monthly AI Credits
                    </span>
                    <p className="text-sm font-bold text-slate-900">
                      {usage.aiRequestsUsed} / {usage.aiRequestsLimit}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4 text-emerald-600" /> S3 File Storage
                    </span>
                    <p className="text-sm font-bold text-slate-900">
                      {(usage.storageUsedMb / 1024).toFixed(1)} GB / {(usage.storageLimitMb / 1024).toFixed(0)} GB
                    </p>
                  </div>
                </div>
              )}
            </div>
  );
}
