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
  Bell,
  CreditCard,
  HardDrive,
  Zap,
  ArrowRight,
  Shield,
  Trash2,
  Copy,
  Link as LinkIcon,
  UserPlus,
  Info,
  Lock,
  AlertTriangle,
  X,
  Smartphone,
  Monitor,
  KeyRound,
  Volume2,
  Moon,
  Sun,
  Laptop,
  Globe,
  Calendar,
  BadgeCheck,
  QrCode,
  Download,
  FileText,
} from "lucide-react";
import { workspaceApi, projectApi, githubApi, notificationApi, billingApi, authApi } from "../../../lib/api";
import { RBAC_ROLE_PERMISSIONS_MATRIX, ROLES } from "@devflow/shared";
import Link from "next/link";
import toast from "react-hot-toast";

type TabId = "profile" | "security" | "preferences" | "workspace" | "privacy" | "terms" | "notifications" | "billing" | "ai" | "legal";

interface UserPreferences {
  defaultView: "dashboard" | "kanban" | "issues" | "prs";
  dateFormat: "MMM D, YYYY" | "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY";
  timeFormat: "12h" | "24h";
  theme: "light" | "dark" | "system";
  emailAlerts: boolean;
  soundEffects: boolean;
}

const DATE_FORMAT_OPTIONS = [
  { id: "MMM D, YYYY", label: "Aug 20, 2026", description: "Standard (Month Day, Year)" },
  { id: "YYYY-MM-DD", label: "2026-08-20", description: "ISO 8601 (Year-Month-Day)" },
  { id: "MM/DD/YYYY", label: "08/20/2026", description: "US Format (Month/Day/Year)" },
  { id: "DD/MM/YYYY", label: "20/08/2026", description: "European Format (Day/Month/Year)" },
];

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (US & Canada) — UTC-5" },
  { value: "America/Chicago", label: "Central Time (US & Canada) — UTC-6" },
  { value: "America/Denver", label: "Mountain Time (US & Canada) — UTC-7" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada) — UTC-8" },
  { value: "Europe/London", label: "London, Dublin, Edinburgh — UTC+0" },
  { value: "Europe/Berlin", label: "Amsterdam, Berlin, Rome, Paris — UTC+1" },
  { value: "Asia/Kolkata", label: "Mumbai, New Delhi, Bangalore — UTC+5:30" },
  { value: "Asia/Tokyo", label: "Tokyo, Seoul, Osaka — UTC+9" },
  { value: "Australia/Sydney", label: "Sydney, Melbourne, Brisbane — UTC+10" },
];

const AVATAR_GRADIENTS = [
  { id: "from-indigo-600 to-blue-500", label: "Indigo & Blue" },
  { id: "from-purple-600 to-pink-500", label: "Purple & Pink" },
  { id: "from-emerald-600 to-teal-500", label: "Emerald & Teal" },
  { id: "from-amber-500 to-orange-500", label: "Amber & Orange" },
  { id: "from-rose-600 to-red-500", label: "Rose & Crimson" },
  { id: "from-cyan-600 to-blue-600", label: "Cyan & Ocean" },
];

export function useSettings() {
const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [user, setUser] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Forms State
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    title: "Senior Software Engineer",
    bio: "Building modern developer platforms and AI copilots.",
    timezone: "America/New_York",
    githubUsername: "alice-chen",
    avatarGradient: "from-indigo-600 to-blue-500",
  });
  const [workspaceForm, setWorkspaceForm] = useState({ name: "", description: "", slug: "" });
  const [inviteForm, setInviteForm] = useState({ email: "", role: "DEVELOPER" });

  // Password & Security State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Two-Factor Authentication State
  const [is2FaEnabled, setIs2FaEnabled] = useState(false);
  const [is2FaModalOpen, setIs2FaModalOpen] = useState(false);
  const [twoFaSetupData, setTwoFaSetupData] = useState<{
    secret: string;
    otpauthUrl: string;
    qrCodeUrl: string;
    recoveryCodes: string[];
  } | null>(null);
  const [twoFaCodeInput, setTwoFaCodeInput] = useState("");
  const [verifying2Fa, setVerifying2Fa] = useState(false);
  const [twoFaCopied, setTwoFaCopied] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisable2Fa, setShowDisable2Fa] = useState(false);

  // Active Login Sessions
  const [sessions, setSessions] = useState<any[]>([]);

  // Workspace Security Policies
  const [securityPolicies, setSecurityPolicies] = useState({
    enforceTwoFactor: false,
    restrictProjectCreation: true,
    publicIssuesRead: false,
    sessionTimeoutHours: 24,
  });

  // Team & Invites State
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [shareableLink, setShareableLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [isRbacModalOpen, setIsRbacModalOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState("ALL");
  const [generatingLink, setGeneratingLink] = useState(false);

  // App Preferences State
  const [preferences, setPreferences] = useState<UserPreferences>({
    defaultView: "dashboard",
    dateFormat: "MMM D, YYYY",
    timeFormat: "12h",
    theme: "light",
    emailAlerts: false,
    soundEffects: true,
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

  // Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState({
    emailAlerts: true,
    assignmentAlerts: true,
    mentionAlerts: true,
    prAlerts: true,
    slaAlerts: true,
    weeklyDigest: false,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);

  // Billing Summary State
  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    // Read query tab param (e.g. ?tab=profile, ?tab=security, ?tab=preferences)
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab") as TabId;
    if (tabParam) {
      setActiveTab(tabParam);
    }

    // Load User
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setProfileForm((prev) => ({
        ...prev,
        name: parsed.name || prev.name,
        email: parsed.email || prev.email,
        title: parsed.title || prev.title,
        bio: parsed.bio || prev.bio,
      }));
    }

    // Load Profile from API
    authApi.getProfile().then((res) => {
      if (res.success && res.data) {
        setProfileForm((prev) => ({
          ...prev,
          name: res.data.name || prev.name,
          email: res.data.email || prev.email,
          title: res.data.title || prev.title,
          bio: res.data.bio || prev.bio,
          timezone: res.data.timezone || prev.timezone,
          githubUsername: res.data.githubUsername || prev.githubUsername,
          avatarGradient: res.data.avatar || prev.avatarGradient,
        }));
        setIs2FaEnabled(res.data.isTwoFactorEnabled || false);
      }
    }).catch(() => {});

    // Load Sessions from API
    authApi.getSessions().then((res) => {
      if (res.success && res.data) setSessions(res.data);
    }).catch(() => {});

    // Load Preferences
    const storedDefaultView = localStorage.getItem("preferredDefaultView") as any;
    const storedDateFormat = localStorage.getItem("preferredDateFormat") as any;
    const storedTimeFormat = (localStorage.getItem("preferredTimeFormat") as any) || "12h";
    const storedTheme = (localStorage.getItem("preferredTheme") as any) || "light";

    setPreferences((prev) => ({
      ...prev,
      defaultView: storedDefaultView || "dashboard",
      dateFormat: storedDateFormat || "MMM D, YYYY",
      timeFormat: storedTimeFormat,
      theme: storedTheme,
    }));

    // Load Notification Preferences
    notificationApi.getPreferences().then((res) => {
      if (res.success && res.data) setNotifPrefs(res.data);
    }).catch(() => {});

    // Load Workspace & Members & Billing
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
            slug: detailedRes.data.slug || "",
          });
          fetchProjectsAndRepo(primaryWorkspace.id);

          billingApi.getSubscription(primaryWorkspace.id).then((r) => {
            if (r.success && r.data) setSubscription(r.data);
          }).catch(() => {});
          billingApi.getUsageQuota(primaryWorkspace.id).then((r) => {
            if (r.success && r.data) setUsage(r.data);
          }).catch(() => {});

          workspaceApi.getSecurityPolicies(primaryWorkspace.id).then((r) => {
            if (r.success && r.data) setSecurityPolicies(r.data);
          }).catch(() => {});

          workspaceApi.getInvites(primaryWorkspace.id).then((r) => {
            if (r.success && r.data) setPendingInvites(r.data);
          }).catch(() => {});
        }
      }
    } catch (err: any) {
      console.error("Failed to load workspace data:", err);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, role: string) => {
    if (!workspace) return;
    try {
      setError("");
      setSuccess("");
      const res = await workspaceApi.updateRole(workspace.id, memberId, role);
      if (res.success) {
        setSuccess("Member role updated successfully!");
        fetchWorkspaceData();
      } else {
        throw new Error(res.error || "Failed to update role");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update member role");
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!workspace) return;
    if (!confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) return;
    try {
      setError("");
      setSuccess("");
      const res = await workspaceApi.removeMember(workspace.id, memberId);
      if (res.success) {
        setSuccess(`Removed ${memberName} from workspace.`);
        fetchWorkspaceData();
      } else {
        throw new Error(res.error || "Failed to remove member");
      }
    } catch (err: any) {
      setError(err.message || "Failed to remove member");
    }
  };

  const handleGenerateInviteLink = async () => {
    if (!workspace) return;
    try {
      setGeneratingLink(true);
      const res = await workspaceApi.createInviteLink(workspace.id, inviteForm.role || "DEVELOPER");
      if (res.success && res.data) {
        setShareableLink(res.data.inviteUrl);
        setPendingInvites((prev) => [res.data, ...prev]);
        setSuccess("Shareable invitation link generated!");
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate invite link");
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!workspace) return;
    try {
      const res = await workspaceApi.revokeInvite(workspace.id, inviteId);
      if (res.success) {
        setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
        setSuccess("Invitation revoked.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to revoke invitation");
    }
  };

  const handleCopyInviteLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const handleSaveNotifPrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNotifs(true);
    setError("");
    setSuccess("");
    try {
      const res = await notificationApi.updatePreferences(notifPrefs);
      if (res.success) {
        setSuccess("Notification rules updated successfully!");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save notification preferences");
    } finally {
      setSavingNotifs(false);
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
      localStorage.setItem("preferredTimeFormat", preferences.timeFormat);
      localStorage.setItem("preferredTheme", preferences.theme);
      
      if (user) {
        const updatedUser = {
          ...user,
          preferences: {
            defaultView: preferences.defaultView,
            dateFormat: preferences.dateFormat,
            timeFormat: preferences.timeFormat,
            theme: preferences.theme,
          },
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      setSuccess("Preferences saved! Your application settings are now active.");
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
      const res = await authApi.updateProfile({
        name: profileForm.name,
        title: profileForm.title,
        bio: profileForm.bio,
        timezone: profileForm.timezone,
        githubUsername: profileForm.githubUsername,
        avatar: profileForm.avatarGradient,
      });

      if (res.success) {
        setSuccess("Profile settings updated successfully!");
        const updatedUser = { ...user, ...res.data };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        window.dispatchEvent(new Event("storage"));
      } else {
        throw new Error(res.error || "Failed to update profile");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      return;
    }

    setChangingPassword(true);
    setError("");
    setSuccess("");

    try {
      const res = await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (res.success) {
        setSuccess("Password updated successfully!");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        throw new Error(res.error || "Failed to update password");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleStart2FaSetup = async () => {
    try {
      setError("");
      const res = await authApi.setup2Fa();
      if (res.success && res.data) {
        setTwoFaSetupData(res.data);
        setIs2FaModalOpen(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to initiate 2FA setup");
    }
  };

  const handleVerify2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying2Fa(true);
    setError("");

    try {
      const res = await authApi.verify2Fa(twoFaCodeInput);
      if (res.success) {
        setIs2FaEnabled(true);
        setIs2FaModalOpen(false);
        setRecoveryCodes(res.data?.recoveryCodes || twoFaSetupData?.recoveryCodes || []);
        setTwoFaCodeInput("");
        setSuccess("Two-Factor Authentication is now enabled on your account!");
      } else {
        throw new Error(res.error || "Invalid 6-digit verification code");
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify 2FA code");
    } finally {
      setVerifying2Fa(false);
    }
  };

  const handleDisable2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await authApi.disable2Fa(disablePassword);
      if (res.success) {
        setIs2FaEnabled(false);
        setShowDisable2Fa(false);
        setDisablePassword("");
        setSuccess("Two-Factor Authentication disabled.");
      } else {
        throw new Error(res.error || "Failed to disable 2FA");
      }
    } catch (err: any) {
      setError(err.message || "Failed to disable 2FA");
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await authApi.revokeSession(sessionId);
      if (res.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        setSuccess("Session revoked successfully.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to revoke session");
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
    { id: "profile" as TabId, label: "My Profile", icon: UserIcon },
    { id: "security" as TabId, label: "Security & 2FA", icon: ShieldCheck },
    { id: "preferences" as TabId, label: "App Preferences", icon: Sliders },
    { id: "workspace" as TabId, label: "Workspace", icon: SettingsIcon },
    { id: "privacy" as TabId, label: "Privacy Policy", icon: Shield },
    { id: "terms" as TabId, label: "Terms & Conditions", icon: FileText },
    { id: "notifications" as TabId, label: "Notification Rules", icon: Bell },
    { id: "billing" as TabId, label: "Billing & Plans", icon: CreditCard },
  ];
  return {
    activeTab, availableRepos, changingPassword, connectedRepo, disablePassword, error, fetchProjectsAndRepo, fetchWorkspaceData, generatingLink, githubMode, handleChangePassword, handleCopyInviteLink, handleDisable2Fa, handleGenerateInviteLink, handleInviteSubmit, handleLinkRepo, handleOAuthStart, handlePreferencesSubmit, handleProfileSubmit, handleRemoveMember, handleRevokeInvite, handleRevokeSession, handleSaveNotifPrefs, handleStart2FaSetup, handleSyncPrs, handleUnlinkRepo, handleUpdateMemberRole, handleVerify2Fa, handleVerifyPat, handleWorkspaceSubmit, inviteForm, is2FaEnabled, is2FaModalOpen, isRbacModalOpen, linkCopied, linkingRepo, loadConnectedRepo, loadingRepo, memberRoleFilter, memberSearch, notifPrefs, passwordForm, patToken, pendingInvites, preferences, profileForm, projects, recoveryCodes, saving, savingNotifs, securityPolicies, selectedProjectId, selectedRepoFullName, sessions, setActiveTab, setAvailableRepos, setChangingPassword, setConnectedRepo, setDisablePassword, setError, setGeneratingLink, setGithubMode, setInviteForm, setIs2FaEnabled, setIs2FaModalOpen, setIsRbacModalOpen, setLinkCopied, setLinkingRepo, setLoadingRepo, setMemberRoleFilter, setMemberSearch, setNotifPrefs, setPasswordForm, setPatToken, setPendingInvites, setPreferences, setProfileForm, setProjects, setRecoveryCodes, setSaving, setSavingNotifs, setSecurityPolicies, setSelectedProjectId, setSelectedRepoFullName, setSessions, setShareableLink, setShowDisable2Fa, setSubscription, setSuccess, setSyncingPrs, setTwoFaCodeInput, setTwoFaCopied, setTwoFaSetupData, setUsage, setUser, setVerifying2Fa, setVerifyingPat, setWorkspace, setWorkspaceForm, shareableLink, showDisable2Fa, subscription, success, syncingPrs, tabs, twoFaCodeInput, twoFaCopied, twoFaSetupData, usage, user, verifying2Fa, verifyingPat, workspace, workspaceForm
  };
}
