"use client";

import { useEffect, useState } from "react";
import {
  User as UserIcon,
  Settings as SettingsIcon,
  Users as UsersIcon,
  Sliders,
  LayoutDashboard,
  Columns3,
  Check,
  AlertCircle,
  Sparkles,
  Save,
  Clock,
  Github,
  GitBranch,
  GitPullRequest,
  RefreshCw,
  Link2,
  Unlink,
  ExternalLink,
  Key,
  ShieldCheck,
  FolderGit2,
} from "lucide-react";
import { workspaceApi, projectApi, githubApi } from "../../../lib/api";

type TabId = "preferences" | "profile" | "workspace" | "members" | "ai" | "github";

interface UserPreferences {
  defaultView: "dashboard" | "kanban";
  dateFormat: "MMM D, YYYY" | "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY";
  emailAlerts: boolean;
}

const DATE_FORMAT_OPTIONS = [
  { id: "MMM D, YYYY", label: "Aug 20, 2026", description: "Standard (Month Day, Year)" },
  { id: "YYYY-MM-DD", label: "2026-08-20", description: "ISO 8601 (Year-Month-Day)" },
  { id: "MM/DD/YYYY", label: "08/20/2026", description: "US Format (Month/Day/Year)" },
  { id: "DD/MM/YYYY", label: "20/08/2026", description: "European Format (Day/Month/Year)" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("preferences");
  const [user, setUser] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Forms State
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [workspaceForm, setWorkspaceForm] = useState({ name: "", description: "" });
  const [inviteForm, setInviteForm] = useState({ email: "", role: "DEVELOPER" });

  // App Preferences State
  const [preferences, setPreferences] = useState<UserPreferences>({
    defaultView: "dashboard",
    dateFormat: "MMM D, YYYY",
    emailAlerts: false,
  });

  // GitHub Integration State
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [connectedRepo, setConnectedRepo] = useState<any>(null);
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [githubMode, setGithubMode] = useState<"pat" | "oauth">("pat");
  const [patToken, setPatToken] = useState("");
  const [verifyingPat, setVerifyingPat] = useState(false);
  const [availableRepos, setAvailableRepos] = useState<any[]>([]);
  const [selectedRepoFullName, setSelectedRepoFullName] = useState("");
  const [linkingRepo, setLinkingRepo] = useState(false);
  const [syncingPrs, setSyncingPrs] = useState(false);

  useEffect(() => {
    // Load User
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setProfileForm({ name: parsed.name || "", email: parsed.email || "" });
    }

    // Load Preferences
    const storedDefaultView = localStorage.getItem("preferredDefaultView") as "dashboard" | "kanban" | null;
    const storedDateFormat = localStorage.getItem("preferredDateFormat") as UserPreferences["dateFormat"] | null;

    setPreferences((prev) => ({
      ...prev,
      defaultView: storedDefaultView || "dashboard",
      dateFormat: storedDateFormat || "MMM D, YYYY",
    }));

    // Load Workspace & Members
    fetchWorkspaceData();

    // Listen for OAuth postMessage
    const handleOAuthMessage = async (event: MessageEvent) => {
      if (event.data?.type === "DEVFLOW_GITHUB_OAUTH_SUCCESS" && event.data?.token) {
        const token = event.data.token;
        setPatToken(token);
        setVerifyingPat(true);
        try {
          const res = await githubApi.verifyPat(token);
          if (res.success) {
            setAvailableRepos(res.data);
            setSuccess("GitHub account authenticated via OAuth! Select a repository to link.");
          }
        } catch (err: any) {
          setError(err.message || "Failed to fetch repositories with OAuth token");
        } finally {
          setVerifyingPat(false);
        }
      }
    };
    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, []);

  const fetchWorkspaceData = async () => {
    try {
      const workspacesRes = await workspaceApi.list();
      
      if (workspacesRes.success && workspacesRes.data.length > 0) {
        const primaryWorkspace = workspacesRes.data[0];
        const detailedRes = await workspaceApi.get(primaryWorkspace.id);
        if (detailedRes.success) {
          setWorkspace(detailedRes.data);
          setWorkspaceForm({
            name: detailedRes.data.name || "",
            description: detailedRes.data.description || "",
          });
          fetchProjectsAndRepo(primaryWorkspace.id);
        }
      }
    } catch (err: any) {
      console.error("Failed to load workspace data:", err);
    }
  };

  const fetchProjectsAndRepo = async (workspaceId: string) => {
    try {
      const projRes = await projectApi.list(workspaceId);
      if (projRes.success && projRes.data.length > 0) {
        setProjects(projRes.data);
        const initialProjId = projRes.data[0].id;
        setSelectedProjectId(initialProjId);
        loadConnectedRepo(initialProjId);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  const loadConnectedRepo = async (projectId: string) => {
    if (!projectId) return;
    setLoadingRepo(true);
    try {
      const res = await githubApi.getRepo(projectId);
      if (res.success) {
        setConnectedRepo(res.data);
      }
    } catch (err) {
      console.error("Failed to load connected repo:", err);
    } finally {
      setLoadingRepo(false);
    }
  };

  const handlePreferencesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      localStorage.setItem("preferredDefaultView", preferences.defaultView);
      localStorage.setItem("preferredDateFormat", preferences.dateFormat);
      
      if (user) {
        const updatedUser = {
          ...user,
          preferences: {
            defaultView: preferences.defaultView,
            dateFormat: preferences.dateFormat,
          },
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      setSuccess("Preferences saved! Your settings are now active.");
      window.dispatchEvent(new Event("storage"));
    } catch (err: any) {
      setError(err.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updatedUser = { ...user, name: profileForm.name, email: profileForm.email };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSuccess("Profile settings updated successfully!");
      window.dispatchEvent(new Event("storage"));
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;
    
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await workspaceApi.update(workspace.id, {
        name: workspaceForm.name,
        description: workspaceForm.description,
      });

      if (res.success) {
        setWorkspace(res.data);
        setSuccess("Workspace settings updated successfully!");
        fetchWorkspaceData();
      } else {
        throw new Error(res.error || "Failed to update workspace");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update workspace settings");
    } finally {
      setSaving(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;
    
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await workspaceApi.invite(workspace.id, inviteForm.email, inviteForm.role);

      if (res.success) {
        setSuccess(`Successfully invited ${inviteForm.email} to the workspace!`);
        setInviteForm({ email: "", role: "DEVELOPER" });
        const detailedRes = await workspaceApi.get(workspace.id);
        if (detailedRes.success) {
          setWorkspace(detailedRes.data);
        }
      } else {
        throw new Error(res.error || "Failed to send invitation");
      }
    } catch (err: any) {
      setError(err.message || "Failed to invite user");
    } finally {
      setSaving(false);
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
        loadConnectedRepo(selectedProjectId);
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

  const tabs = [
    { id: "preferences" as TabId, label: "App Preferences", icon: Sliders },
    { id: "profile" as TabId, label: "My Profile", icon: UserIcon },
    { id: "workspace" as TabId, label: "Workspace", icon: SettingsIcon },
    { id: "members" as TabId, label: "Team & RBAC", icon: UsersIcon },
    { id: "github" as TabId, label: "GitHub Integration", icon: Github },
    { id: "ai" as TabId, label: "AI Copilot", icon: Sparkles },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto text-slate-900">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Workspace Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure application defaults, date formats, permissions, and AI features
        </p>
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

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-1 bg-white rounded-xl p-2 border border-slate-200 shadow-2xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setError("");
                  setSuccess("");
                }}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Panel Content */}
        <div className="lg:col-span-3 bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
          
          {/* ─── 1. APP PREFERENCES ─── */}
          {activeTab === "preferences" && (
            <form onSubmit={handlePreferencesSubmit} className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  Application Preferences
                </h3>
                <p className="text-xs text-slate-500">
                  Customize your default start-up page and localized date display across the platform
                </p>
              </div>

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
                <p className="text-xs text-slate-500">
                  Select the timestamp formatting used in issue histories and sprint milestones.
                </p>

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
                      Issue PHX-1042 created on{" "}
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

              <div className="pt-2">
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
          )}

          {/* ─── 2. MY PROFILE ─── */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Personal Details</h3>
                <p className="text-xs text-slate-500">
                  Update your display name and login email address
                </p>
              </div>

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
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-900 outline-none transition-colors"
                    placeholder="alice@devflow.io"
                  />
                </div>
              </div>

              <div className="pt-2">
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
          )}

          {/* ─── 3. WORKSPACE SETTINGS ─── */}
          {activeTab === "workspace" && (
            <form onSubmit={handleWorkspaceSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Workspace Settings</h3>
                <p className="text-xs text-slate-500">
                  Configure your primary engineering organization details
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    required
                    value={workspaceForm.name}
                    onChange={(e) => setWorkspaceForm({ ...workspaceForm, name: e.target.value })}
                    className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-900 outline-none transition-colors"
                    placeholder="e.g. Phoenix Labs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={workspaceForm.description}
                    onChange={(e) => setWorkspaceForm({ ...workspaceForm, description: e.target.value })}
                    className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-900 outline-none transition-colors"
                    placeholder="Primary engineering workspace for platform developers"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 px-6 rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving Changes..." : "Save Workspace"}</span>
                </button>
              </div>
            </form>
          )}

          {/* ─── 4. TEAM MEMBERS & RBAC ─── */}
          {activeTab === "members" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Team Members &amp; RBAC</h3>
                <p className="text-xs text-slate-500">
                  Manage organization access, roles, and member invitations
                </p>
              </div>

              {/* Invite Form */}
              <form onSubmit={handleInviteSubmit} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-indigo-700 uppercase">Invite New Member</span>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="engineer@company.com"
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500"
                  />
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    <option value="DEVELOPER">Lead Engineer</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MAINTAINER">Engineering Manager</option>
                    <option value="VIEWER">QA / Viewer</option>
                  </select>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
                  >
                    Invite
                  </button>
                </div>
              </form>

              {/* Members List */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {[
                  { name: "Alice Chen", role: "Admin", email: "alice@devflow.io" },
                  { name: "Bob Martinez", role: "Lead Engineer", email: "bob@devflow.io" },
                  { name: "Carol Zhang", role: "QA Engineer", email: "carol@devflow.io" },
                  { name: "David Kim", role: "DevOps Engineer", email: "david@devflow.io" },
                ].map((m, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                        {m.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{m.name}</p>
                        <p className="text-[11px] text-slate-500">{m.email}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── 5. GITHUB INTEGRATION ─── */}
          {activeTab === "github" && (
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
          )}

          {/* ─── 6. AI COPILOT CONFIGURATION ─── */}
          {activeTab === "ai" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  DevFlow AI Copilot Configuration
                </h3>
                <p className="text-xs text-slate-500">
                  AI-powered semantic code analyzer, stack trace decoder, and automatic subtask decomposition
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <div>
                    <span className="text-slate-900 font-semibold block">Automatic Root Cause &amp; Priority Suggestions</span>
                    <span className="text-xs text-slate-500 block">Analyze incoming error logs and assign priority heuristics</span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 accent-indigo-600"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <div>
                    <span className="text-slate-900 font-semibold block">Auto-generate Actionable Subtasks</span>
                    <span className="text-xs text-slate-500 block">Pre-populate unit test &amp; code verification subtasks for bug tickets</span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 accent-indigo-600"
                  />
                </label>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-900 shadow-2xs">
                      <Github className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">GitHub Organization Sync</p>
                      <p className="text-[11px] text-emerald-700 font-semibold">Connected to github.com/devflow-demo</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Active Sync
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
