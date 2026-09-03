"use client";

import { useEffect, useState } from "react";
import {
  Github,
  GitPullRequest,
  GitBranch,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  ShieldCheck,
  Key,
  Lock,
  Radio,
  Check,
  Copy,
  Trash2,
  FolderGit2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { githubApi, workspaceApi, projectApi } from "@/lib/api";

export default function GitHubIntegrationPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [connectedRepo, setConnectedRepo] = useState<any>(null);
  const [githubMode, setGithubMode] = useState<"pat" | "oauth">("pat");
  const [patToken, setPatToken] = useState("");
  const [availableRepos, setAvailableRepos] = useState<any[]>([]);
  const [selectedRepoFullName, setSelectedRepoFullName] = useState("");

  const [loading, setLoading] = useState(true);
  const [verifyingPat, setVerifyingPat] = useState(false);
  const [linkingRepo, setLinkingRepo] = useState(false);
  const [syncingPrs, setSyncingPrs] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Branch Helper State
  const [branchIssueKey, setBranchIssueKey] = useState("SS-3");
  const [branchIssueTitle, setBranchIssueTitle] = useState("implement product search with filters");
  const [branchType, setBranchType] = useState("feat");
  const [copiedBranch, setCopiedBranch] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError("");
      const wsRes = await workspaceApi.list();
      if (wsRes.success && wsRes.data.length > 0) {
        const wsId = wsRes.data[0].id;
        const projRes = await projectApi.list(wsId);
        if (projRes.success && projRes.data.length > 0) {
          setProjects(projRes.data);
          const firstProj = projRes.data[0];
          setSelectedProjectId(firstProj.id);
          setBranchIssueKey(`${firstProj.key}-3`);
          loadRepo(firstProj.id);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const loadRepo = async (projId: string) => {
    try {
      const res = await githubApi.getRepo(projId);
      if (res.success && res.data) {
        setConnectedRepo(res.data);
      } else {
        setConnectedRepo(null);
      }
    } catch (err) {
      setConnectedRepo(null);
    }
  };

  const handleVerifyPat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patToken.trim()) {
      setError("Please enter a personal access token");
      return;
    }
    setVerifyingPat(true);
    setError("");
    setSuccess("");
    try {
      const res = await githubApi.verifyPat(patToken.trim());
      if (res.success) {
        setAvailableRepos(res.data);
        if (res.data.length > 0) {
          setSelectedRepoFullName(res.data[0].fullName);
        }
        setSuccess(`Found ${res.data.length} accessible repositories! Select one to link.`);
      } else {
        throw new Error(res.error || "Failed to verify GitHub token");
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify token");
    } finally {
      setVerifyingPat(false);
    }
  };

  const handleLinkRepo = async () => {
    if (!selectedProjectId || !selectedRepoFullName) {
      setError("Please select a project and a repository");
      return;
    }
    const repoObj = availableRepos.find((r) => r.fullName === selectedRepoFullName);
    if (!repoObj) {
      setError("Selected repository not found");
      return;
    }
    setLinkingRepo(true);
    setError("");
    setSuccess("");
    try {
      const res = await githubApi.linkRepo(selectedProjectId, {
        name: repoObj.name,
        fullName: repoObj.fullName,
        owner: repoObj.owner,
        githubRepoId: repoObj.id,
        url: repoObj.url,
        defaultBranch: repoObj.defaultBranch,
        authType: githubMode.toUpperCase(),
        token: patToken.trim(),
      });
      if (res.success) {
        setConnectedRepo(res.data);
        setSuccess(`Successfully linked repository ${repoObj.fullName} to project!`);
        setAvailableRepos([]);
      } else {
        throw new Error(res.error || "Failed to link repository");
      }
    } catch (err: any) {
      setError(err.message || "Failed to link repository");
    } finally {
      setLinkingRepo(false);
    }
  };

  const handleUnlinkRepo = async () => {
    if (!selectedProjectId) return;
    if (!confirm("Are you sure you want to unlink this repository? Linked pull requests will be removed.")) return;
    setLinkingRepo(true);
    setError("");
    setSuccess("");
    try {
      const res = await githubApi.unlinkRepo(selectedProjectId);
      if (res.success) {
        setConnectedRepo(null);
        setSuccess("Repository unlinked successfully.");
      } else {
        throw new Error(res.error || "Failed to unlink repository");
      }
    } catch (err: any) {
      setError(err.message || "Failed to unlink repository");
    } finally {
      setLinkingRepo(false);
    }
  };

  const handleSyncPrs = async () => {
    if (!selectedProjectId) return;
    setSyncingPrs(true);
    setError("");
    setSuccess("");
    try {
      const res = await githubApi.syncPrs(selectedProjectId);
      if (res.success) {
        setSuccess(`Successfully synced ${res.data.length} pull requests from GitHub!`);
        loadRepo(selectedProjectId);
      } else {
        throw new Error(res.error || "Failed to sync pull requests");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sync pull requests");
    } finally {
      setSyncingPrs(false);
    }
  };

  const handleOAuthStart = async () => {
    try {
      const res = await githubApi.getOAuthUrl(selectedProjectId);
      if (res.success && res.data.url) {
        window.open(res.data.url, "devflow_github_oauth", "width=600,height=700");
      } else {
        throw new Error(res.error || "Failed to initiate OAuth");
      }
    } catch (err: any) {
      setError(err.message || "OAuth initiation failed");
    }
  };

  const generatedBranch = `${branchType}/${branchIssueKey.toLowerCase()}-${branchIssueTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto text-slate-900 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Github className="w-6 h-6 text-slate-900" />
            GitHub &amp; VCS Integration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Connect GitHub repositories to link pull requests, auto-sync issue statuses, and generate branch names
          </p>
        </div>

        {connectedRepo && (
          <button
            type="button"
            onClick={handleSyncPrs}
            disabled={syncingPrs}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-center disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingPrs ? "animate-spin" : ""}`} />
            <span>{syncingPrs ? "Syncing PRs..." : "Sync Pull Requests"}</span>
          </button>
        )}
      </div>

      {/* Alerts */}
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

      {/* Project Selector Bar */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Target Project
        </label>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={selectedProjectId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedProjectId(id);
              const p = projects.find((x) => x.id === id);
              if (p) setBranchIssueKey(`${p.key}-3`);
              loadRepo(id);
            }}
            className="w-full sm:w-80 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-900 font-semibold outline-none transition-colors"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-500">
            Repository links and webhook listeners are isolated per project
          </span>
        </div>
      </div>

      {/* ─── CONNECTED REPOSITORY CARD ─── */}
      {connectedRepo ? (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md shrink-0">
                <Github className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 font-mono">
                    {connectedRepo.fullName}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Default branch: <span className="text-indigo-600 font-semibold">{connectedRepo.defaultBranch}</span> &bull; Auth: {connectedRepo.authType}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <a
                href={connectedRepo.url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <span>Open on GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={handleUnlinkRepo}
                disabled={linkingRepo}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition-colors cursor-pointer"
              >
                Unlink
              </button>
            </div>
          </div>

          {/* Webhook & Sync Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 font-semibold uppercase text-[10px]">Webhook Pipeline</span>
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                HMAC SHA-256 Active
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 font-semibold uppercase text-[10px]">Linked Pull Requests</span>
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <GitPullRequest className="w-4 h-4 text-indigo-600" />
                {connectedRepo.pullRequests?.length || 0} Synced PRs
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 font-semibold uppercase text-[10px]">Branch Prefix Automation</span>
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-amber-600" />
                feat/ &bull; fix/ &bull; chore/
              </p>
            </div>
          </div>

          {/* Linked PRs List */}
          {connectedRepo.pullRequests && connectedRepo.pullRequests.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Recent Synced Pull Requests
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {connectedRepo.pullRequests.map((pr: any) => (
                  <div key={pr.id} className="p-3.5 flex items-center justify-between gap-3 bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <GitPullRequest className={`w-4 h-4 ${pr.state === "OPEN" ? "text-emerald-600" : "text-purple-600"}`} />
                      <div>
                        <a
                          href={pr.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-slate-900 hover:text-indigo-600 flex items-center gap-1.5 font-mono"
                        >
                          #{pr.number} {pr.title}
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {pr.branchName} &bull; by {pr.author}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      pr.state === "OPEN"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-purple-50 text-purple-700 border border-purple-200"
                    }`}>
                      {pr.state}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ─── REPOSITORY CONNECTION FORMS ─── */
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-6">
          {/* Auth Method Selector */}
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <button
              type="button"
              onClick={() => setGithubMode("pat")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                githubMode === "pat"
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Personal Access Token (PAT)</span>
            </button>

            <button
              type="button"
              onClick={() => setGithubMode("oauth")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                githubMode === "oauth"
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>GitHub OAuth (One-Click)</span>
            </button>
          </div>

          {/* Option A: PAT Mode */}
          {githubMode === "pat" && (
            <form onSubmit={handleVerifyPat} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GitHub Personal Access Token (Fine-grained or Classic)
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Token requires <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px] text-indigo-700 font-bold">repo</code> or <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px] text-indigo-700 font-bold">pull_requests:read,write</code> scope.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    required
                    value={patToken}
                    onChange={(e) => setPatToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_xxxxxxxx"
                    className="flex-1 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg p-2.5 text-xs text-slate-900 font-mono outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={verifyingPat}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {verifyingPat ? "Verifying..." : "Verify & Load Repos"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Option B: OAuth Mode */}
          {githubMode === "oauth" && (
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <Github className="w-10 h-10 text-slate-900 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Authorize DevFlow OAuth App</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-0.5">
                  Sign in with your GitHub account to grant repository access without manually generating tokens.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOAuthStart}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Connect with GitHub
              </button>
            </div>
          )}

          {/* Repositories Dropdown Picker (once PAT verified) */}
          {availableRepos.length > 0 && (
            <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-4 animate-fade-in">
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                Select Repository to Link
              </h4>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <select
                  value={selectedRepoFullName}
                  onChange={(e) => setSelectedRepoFullName(e.target.value)}
                  className="flex-1 bg-white border border-indigo-200 rounded-lg p-2.5 text-xs text-slate-900 font-mono font-semibold outline-none"
                >
                  {availableRepos.map((r) => (
                    <option key={r.id} value={r.fullName}>
                      {r.fullName} (Default: {r.defaultBranch})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleLinkRepo}
                  disabled={linkingRepo}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {linkingRepo ? "Linking..." : "Link Repository"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── BRANCH HELPER & GENERATOR ─── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-indigo-600" />
            Git Branch Helper &amp; Naming Generator
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Standardize branch names for automatic issue-to-PR linking on GitHub
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Prefix</label>
            <select
              value={branchType}
              onChange={(e) => setBranchType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 outline-none"
            >
              <option value="feat">feat/ (Feature)</option>
              <option value="fix">fix/ (Bug Fix)</option>
              <option value="chore">chore/ (Maintenance)</option>
              <option value="refactor">refactor/ (Cleanup)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Issue Key</label>
            <input
              type="text"
              value={branchIssueKey}
              onChange={(e) => setBranchIssueKey(e.target.value)}
              placeholder="e.g. SS-3"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Feature Slug</label>
            <input
              type="text"
              value={branchIssueTitle}
              onChange={(e) => setBranchIssueTitle(e.target.value)}
              placeholder="e.g. implement product search with filters"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 outline-none"
            />
          </div>
        </div>

        {/* Copyable Git Command */}
        <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between gap-3">
          <code className="font-mono text-xs text-indigo-300 truncate">
            git checkout -b {generatedBranch}
          </code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(`git checkout -b ${generatedBranch}`);
              setCopiedBranch(true);
              setTimeout(() => setCopiedBranch(false), 2000);
            }}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            {copiedBranch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedBranch ? "Copied Command!" : "Copy"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
