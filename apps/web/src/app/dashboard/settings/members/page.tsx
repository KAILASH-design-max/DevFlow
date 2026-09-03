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

export default function MembersTab() {
  const {
    generatingLink, handleCopyInviteLink, handleGenerateInviteLink, handleInviteSubmit, handleRemoveMember, handleRevokeInvite, handleUpdateMemberRole, inviteForm, linkCopied, memberRoleFilter, memberSearch, pendingInvites, saving, setInviteForm, setIsRbacModalOpen, setMemberRoleFilter, setMemberSearch, shareableLink, user, workspace
  } = useSettingsContext();

  return (
    <div className="space-y-8">
              {/* Header with RBAC Matrix CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <UsersIcon className="w-5 h-5 text-indigo-600" />
                    Team Members &amp; Granular RBAC
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manage organization access, assign engineering roles, and inspect permission matrices
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsRbacModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer self-start"
                >
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span>View RBAC Matrix</span>
                </button>
              </div>

              {/* Invite Member Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Direct Email Invite */}
                <form onSubmit={handleInviteSubmit} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4" /> Invite by Email
                  </span>
                  <div className="space-y-2.5">
                    <input
                      type="email"
                      required
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      placeholder="colleague@company.com"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500"
                    />
                    <div className="flex gap-2">
                      <select
                        value={inviteForm.role}
                        onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none font-medium"
                      >
                        <option value="DEVELOPER">Developer</option>
                        <option value="PROJECT_MANAGER">Project Manager</option>
                        <option value="ADMIN">Administrator</option>
                        <option value="TESTER">QA / Tester</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        Send Invite
                      </button>
                    </div>
                  </div>
                </form>

                {/* Shareable Invite Link */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                      <LinkIcon className="w-4 h-4" /> Shareable Invite Link
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Generate a quick join URL for your team members or contractors.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {shareableLink ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={shareableLink}
                          className="flex-1 bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-mono truncate"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopyInviteLink(shareableLink)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs shrink-0 flex items-center gap-1"
                        >
                          {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{linkCopied ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGenerateInviteLink}
                        disabled={generatingLink}
                        className="w-full py-2 bg-white border border-slate-300 hover:border-indigo-400 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>{generatingLink ? "Generating..." : "Generate Shareable Join Link"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Members Roster */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Active Members ({workspace?.members?.length || 4})
                  </h4>

                  {/* Search & Filter */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search members..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 w-44"
                    />
                    <select
                      value={memberRoleFilter}
                      onChange={(e) => setMemberRoleFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700 font-medium"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="ADMIN">Admin</option>
                      <option value="PROJECT_MANAGER">PM</option>
                      <option value="DEVELOPER">Developer</option>
                      <option value="TESTER">Tester</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="divide-y divide-slate-100">
                    {(workspace?.members || [
                      { id: "m1", role: "ADMIN", user: { id: "u1", name: "Alice Chen", email: "alice@devflow.io" } },
                      { id: "m2", role: "DEVELOPER", user: { id: "u2", name: "Bob Martinez", email: "bob@devflow.io" } },
                      { id: "m3", role: "TESTER", user: { id: "u3", name: "Carol Zhang", email: "carol@devflow.io" } },
                      { id: "m4", role: "PROJECT_MANAGER", user: { id: "u4", name: "David Kim", email: "david@devflow.io" } },
                    ])
                      .filter((m: any) => {
                        const name = m.user?.name?.toLowerCase() || "";
                        const email = m.user?.email?.toLowerCase() || "";
                        const q = memberSearch.toLowerCase();
                        const matchesSearch = name.includes(q) || email.includes(q);
                        const matchesRole = memberRoleFilter === "ALL" || m.role === memberRoleFilter;
                        return matchesSearch && matchesRole;
                      })
                      .map((m: any) => (
                        <div
                          key={m.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-2xs">
                              {m.user?.name ? m.user.name[0].toUpperCase() : "U"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-slate-900">{m.user?.name || "Team Member"}</p>
                                {workspace?.ownerId === m.user?.id && (
                                  <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded">
                                    Owner
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500">{m.user?.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            {/* Role Dropdown */}
                            <select
                              value={m.role}
                              onChange={(e) => handleUpdateMemberRole(m.id, e.target.value)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                            >
                              <option value="ADMIN">Administrator</option>
                              <option value="PROJECT_MANAGER">Project Manager</option>
                              <option value="DEVELOPER">Developer</option>
                              <option value="TESTER">QA / Tester</option>
                              <option value="VIEWER">Viewer</option>
                            </select>

                            {/* Remove button */}
                            {workspace?.ownerId !== m.user?.id && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(m.id, m.user?.name || "Member")}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Remove member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Pending Invites List */}
              {pendingInvites.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Pending Invitations ({pendingInvites.length})
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                    {pendingInvites.map((inv) => (
                      <div key={inv.id} className="p-3.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-slate-900">{inv.email}</p>
                          <p className="text-[11px] text-slate-400">
                            Role: <span className="font-medium text-slate-700">{inv.role}</span> • Expires in 7 days
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyInviteLink(inv.inviteUrl)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                          >
                            Copy Link
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevokeInvite(inv.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                          >
                            Revoke
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
  );
}
