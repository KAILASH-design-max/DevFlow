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

export default function GithubTab() {
  const {
    availableRepos, connectedRepo, githubMode, handleLinkRepo, handleOAuthStart, handleSyncPrs, handleUnlinkRepo, handleVerifyPat, linkingRepo, loadConnectedRepo, loadingRepo, patToken, projects, selectedProjectId, selectedRepoFullName, setGithubMode, setPatToken, setSelectedProjectId, setSelectedRepoFullName, syncingPrs, verifyingPat
  } = useSettingsContext();

  return (
    <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <Github className="w-5 h-5 text-slate-900" />
                    GitHub &amp; VCS Integration
                  </h3>
                  <p className="text-xs text-slate-500">
                    Connect GitHub repositories to link pull requests, auto-sync issue statuses, and generate branch names
                  </p>
                </div>

                {/* Project Selector */}
                {projects.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">Project:</span>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value);
                        loadConnectedRepo(e.target.value);
                      }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.key})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {loadingRepo ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                  <p className="text-xs font-medium text-slate-600">Loading repository connection...</p>
                </div>
              ) : connectedRepo ? (
                /* Connected State */
                <div className="space-y-6">
                  <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
                          <FolderGit2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">
                              {connectedRepo.fullName}
                            </h4>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Connected ({connectedRepo.authType})
                            </span>
                          </div>
                          <a
                            href={connectedRepo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-0.5 font-medium"
                          >
                            <span>{connectedRepo.url}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSyncPrs}
                          disabled={syncingPrs}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${syncingPrs ? "animate-spin" : ""}`} />
                          <span>{syncingPrs ? "Syncing..." : "Sync PRs"}</span>
                        </button>
                        <button
                          onClick={handleUnlinkRepo}
                          disabled={linkingRepo}
                          className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                          <span>Unlink</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-500 block text-[11px]">Default Branch</span>
                        <span className="font-semibold text-slate-800 font-mono mt-0.5 block flex items-center gap-1">
                          <GitBranch className="w-3 h-3 text-slate-500" />
                          {connectedRepo.defaultBranch}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-500 block text-[11px]">Security Mode</span>
                        <span className="font-semibold text-emerald-700 mt-0.5 block flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          AES-256-GCM Encrypted
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 col-span-2 sm:col-span-1">
                        <span className="text-slate-500 block text-[11px]">Tracked Pull Requests</span>
                        <span className="font-semibold text-slate-800 mt-0.5 block flex items-center gap-1">
                          <GitPullRequest className="w-3 h-3 text-slate-500" />
                          {connectedRepo.pullRequests?.length || 0} Synced
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Synced Pull Requests Table */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <GitPullRequest className="w-3.5 h-3.5 text-indigo-600" />
                      Recent Synced Pull Requests
                    </h4>

                    {connectedRepo.pullRequests && connectedRepo.pullRequests.length > 0 ? (
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                        {connectedRepo.pullRequests.map((pr: any) => (
                          <div key={pr.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                                pr.state === "MERGED" ? "bg-purple-100 text-purple-700" : pr.state === "OPEN" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                              }`}>
                                #{pr.number}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <a
                                    href={pr.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-semibold text-slate-900 hover:text-indigo-600"
                                  >
                                    {pr.title}
                                  </a>
                                  {pr.issue && (
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                                      #{pr.issue.number}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                  <span className="font-mono text-slate-600">{pr.branch}</span>
                                  <span>&bull;</span>
                                  <span>by {pr.authorName || "unknown"}</span>
                                </div>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              pr.state === "MERGED" ? "bg-purple-50 text-purple-700 border border-purple-200" : pr.state === "OPEN" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}>
                              {pr.state}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                        No pull requests synced yet. Click &quot;Sync PRs&quot; above to fetch from GitHub.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Not Connected State */
                <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-5">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                    <button
                      type="button"
                      onClick={() => setGithubMode("pat")}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        githubMode === "pat"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Personal Access Token (PAT)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGithubMode("oauth")}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        githubMode === "oauth"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      GitHub OAuth (One-Click)
                    </button>
                  </div>

                  {githubMode === "pat" ? (
                    <div className="space-y-4">
                      <form onSubmit={handleVerifyPat} className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            GitHub Personal Access Token (Fine-grained or Classic)
                          </label>
                          <p className="text-[11px] text-slate-500 mb-2">
                            Token requires <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">repo</code> or <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">pull_requests:read,write</code> scope.
                          </p>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                              <input
                                type="password"
                                value={patToken}
                                onChange={(e) => setPatToken(e.target.value)}
                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_xxxxxxxx"
                                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={verifyingPat || !patToken.trim()}
                              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${verifyingPat ? "animate-spin" : ""}`} />
                              <span>{verifyingPat ? "Verifying..." : "Verify & Load Repos"}</span>
                            </button>
                          </div>
                        </div>
                      </form>

                      {/* Repositories Dropdown & Link Form */}
                      {availableRepos.length > 0 && (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-fade-in">
                          <label className="block text-xs font-bold text-slate-800">
                            Select Repository to Link:
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={selectedRepoFullName}
                              onChange={(e) => setSelectedRepoFullName(e.target.value)}
                              className="flex-1 text-xs font-medium px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            >
                              {availableRepos.map((r) => (
                                <option key={r.id} value={r.fullName}>
                                  {r.fullName} {r.private ? "(Private)" : "(Public)"} — {r.defaultBranch}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={handleLinkRepo}
                              disabled={linkingRepo || !selectedRepoFullName}
                              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                              <span>{linkingRepo ? "Linking..." : "Link Repository"}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-900">
                        <Github className="w-6 h-6" />
                      </div>
                      <div className="max-w-md mx-auto">
                        <h4 className="text-sm font-bold text-slate-900">Connect with GitHub OAuth</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Authorize DevFlow to securely access your GitHub organizations and repositories.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleOAuthStart}
                        className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 mx-auto transition-colors cursor-pointer shadow-sm"
                      >
                        <Github className="w-4 h-4" />
                        <span>Authorize with GitHub</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
  );
}
