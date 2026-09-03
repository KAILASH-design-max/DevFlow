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

export default function WorkspaceTab() {
  const {
    error, handleWorkspaceSubmit, projects, saving, securityPolicies, setSecurityPolicies, setWorkspaceForm, workspace, workspaceForm
  } = useSettingsContext();

  return (
    <form onSubmit={handleWorkspaceSubmit} className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 text-indigo-600" />
                  Workspace Profile &amp; Policies
                </h3>
                <p className="text-xs text-slate-500">
                  Configure your primary engineering organization details, public slug, and security policies
                </p>
              </div>

              {/* Organization Branding & Details */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Organization Details
                </h4>

                <div className="flex items-center gap-4 pb-2">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-xl font-black text-white shadow-md shrink-0">
                    {workspaceForm.name ? workspaceForm.name[0].toUpperCase() : "W"}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">{workspaceForm.name || "My Workspace"}</h5>
                    <p className="text-xs text-slate-400 font-mono">
                      devflow.io/ws/{workspaceForm.slug || "workspace"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Workspace Name
                    </label>
                    <input
                      type="text"
                      required
                      value={workspaceForm.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setWorkspaceForm({
                          ...workspaceForm,
                          name,
                          slug: workspaceForm.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                        });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg p-2.5 text-xs text-slate-900 outline-none transition-colors"
                      placeholder="e.g. Phoenix Labs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Workspace URL Slug
                    </label>
                    <input
                      type="text"
                      required
                      value={workspaceForm.slug}
                      onChange={(e) => setWorkspaceForm({ ...workspaceForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg p-2.5 text-xs text-slate-900 font-mono outline-none transition-colors"
                      placeholder="e.g. phoenix-labs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={workspaceForm.description}
                    onChange={(e) => setWorkspaceForm({ ...workspaceForm, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg p-2.5 text-xs text-slate-900 outline-none transition-colors"
                    placeholder="Primary engineering workspace for platform developers"
                  />
                </div>
              </div>

              {/* Security & Access Policies */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" /> Security &amp; Access Controls
                </h4>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Enforce Two-Factor Authentication (2FA)</span>
                      <span className="text-[11px] text-slate-500 block">Require all team members to use 2FA before accessing workspace resources</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={securityPolicies.enforceTwoFactor}
                      onChange={(e) => setSecurityPolicies({ ...securityPolicies, enforceTwoFactor: e.target.checked })}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Restrict Project Creation to Admins</span>
                      <span className="text-[11px] text-slate-500 block">Only Administrators and Project Managers can create and configure new projects</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={securityPolicies.restrictProjectCreation}
                      onChange={(e) => setSecurityPolicies({ ...securityPolicies, restrictProjectCreation: e.target.checked })}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Public Read-Only Issue Access</span>
                      <span className="text-[11px] text-slate-500 block">Allow external stakeholders with link to view public issue status boards</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={securityPolicies.publicIssuesRead}
                      onChange={(e) => setSecurityPolicies({ ...securityPolicies, publicIssuesRead: e.target.checked })}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 px-6 rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving Changes..." : "Save Workspace Settings"}</span>
                </button>
              </div>

              {/* Danger Zone */}
              <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> Danger Zone
                </h4>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-rose-200">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Delete Workspace</h5>
                    <p className="text-[11px] text-slate-500">
                      Permanently remove this workspace, its projects, and all associated issue records.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Are you ABSOLUTELY sure you want to delete this workspace? This action cannot be undone.")) {
                        toast.error("Workspace deletion protection active. Please contact support or empty all projects first.");
                      }
                    }}
                    className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs shrink-0"
                  >
                    Delete Workspace
                  </button>
                </div>
              </div>
            </form>
  );
}
