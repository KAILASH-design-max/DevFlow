"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bug,
  ListTodo,
  Rocket,
  BookOpen,
  Send,
  Sparkles,
  Check,
  X,
  User,
  Clock,
  Tag,
  AlertTriangle,
  ListChecks,
  Footprints,
  Target,
  MessageSquare,
  Activity,
  GitBranch,
  Calendar,
  Layers,
  ChevronRight,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Trash2,
  ExternalLink,
  Copy,
  Maximize2,
  FileCode,
  Download,
  GitCommit as GitCommitIcon,
  Timer,
  PlusCircle,
  Plus,
  History,
  GitPullRequest,
  Edit3,
  Edit2,
  Loader2,
  Eye,
} from "lucide-react";
import {
  ISSUE_STATUS_CONFIG,
  ISSUE_PRIORITY_CONFIG,
  ISSUE_TYPE_CONFIG,
} from "@devflow/shared";
import { attachmentApi, issueApi, commentApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useRealtime } from "@/lib/useRealtime";

interface LocalAttachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploaderName: string;
}

export default function IssueDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    canEditIssue,
    canDeleteIssue,
    canUploadAttachments,
    isViewer,
    role: userRole,
  } = usePermissions();
  const params = useParams();
  const rawId = typeof params?.issueId === "string" ? params.issueId : "SS-1";

  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deletingIssue, setDeletingIssue] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "comments" | "attachments" | "subtasks" | "commits" | "worklogs" | "activity"
  >("comments");
  const [newComment, setNewComment] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [gitCommits, setGitCommits] = useState<any[]>([]);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState("");
  const [savingDesc, setSavingDesc] = useState(false);

  useEffect(() => {
    const fetchLiveIssue = async () => {
      try {
        let loadedData: any = null;

        // 1. Try API
        const res = await issueApi.get(rawId).catch(() => null);
        if (res?.success && res.data) {
          loadedData = res.data;
        }

        if (loadedData) {
          const fallbackSpecs = `### Technical Specifications & Requirements
• Implementation of requirements for ticket ${loadedData.id || rawId}
• Complete parameter validation, type safety, and robust error handling
• Responsive UI flow with accessible controls

### Acceptance Criteria
- [ ] Core business logic executed and verified
- [ ] Automated regression tests passing
- [ ] Code review completed and merged to main branch`;

          const resolvedDescription = (loadedData.description && loadedData.description.trim())
            ? loadedData.description
            : fallbackSpecs;

          setIssue({
            ...loadedData,
            description: resolvedDescription,
            labels: loadedData.labels?.map((l: any) => l.label || l) || [],
          });
          setEditedDesc(resolvedDescription);

          if (loadedData.comments && loadedData.comments.length > 0) {
            setComments(loadedData.comments);
          }
        } else {
          setIssue(null);
        }

        // Fetch persisted comments, worklogs, commits, attachments from API
        const targetId = loadedData?.id || rawId;
        const [apiCommentsRes, apiWorkLogsRes, apiCommitsRes] = await Promise.all([
          commentApi.list(targetId).catch(() => null),
          issueApi.getWorkLogs(targetId).catch(() => null),
          issueApi.getCommits(targetId).catch(() => null),
        ]);

        // Merge Comments
        const apiComments = apiCommentsRes?.success && Array.isArray(apiCommentsRes.data) ? apiCommentsRes.data : [];
        const combined = [...(loadedData?.comments || [])];
        const seenIds = new Set(combined.map((c) => c.id));

        for (const c of apiComments) {
          if (!seenIds.has(c.id)) {
            seenIds.add(c.id);
            combined.push(c);
          }
        }
        if (combined.length > 0) setComments(combined);

        // Merge Work Logs
        const apiWorkLogs = apiWorkLogsRes?.success && Array.isArray(apiWorkLogsRes.data) ? apiWorkLogsRes.data : [];
        if (apiWorkLogs.length > 0) setWorkLogs(apiWorkLogs);

        // Merge Commits
        const apiCommits = apiCommitsRes?.success && Array.isArray(apiCommitsRes.data) ? apiCommitsRes.data : [];
        if (apiCommits.length > 0) setGitCommits(apiCommits);

        // Merge Attachments
        if (loadedData?.attachments && loadedData.attachments.length > 0) {
          setAttachments(loadedData.attachments);
        }
      } catch (err) {
        console.warn("Issue detail fetch notice:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveIssue();
  }, [rawId, user]);

  const handleSaveDescription = async () => {
    try {
      setSavingDesc(true);
      const newDesc = editedDesc.trim();
      setIssue((prev: any) => ({ ...prev, description: newDesc }));

      const targetId = issue.rawId || issue.id || rawId;
      await issueApi.update(targetId, { description: newDesc }).catch(() => {});
      setIsEditingDesc(false);
    } catch (err) {
      console.warn("Failed to save description:", err);
    } finally {
      setSavingDesc(false);
    }
  };
  const [activities, setActivities] = useState<any[]>([
    { id: "act-1", type: "STATUS_CHANGE", message: "Status updated to IN_PROGRESS", authorName: "Alice Chen", createdAt: "2026-08-23T10:00:00Z" },
    { id: "act-2", type: "COMMIT_ATTACHED", message: "Git Commit a4f8b1c attached by Alice Chen", authorName: "Alice Chen", createdAt: "2026-08-23T11:20:00Z" },
    { id: "act-3", type: "WORK_LOGGED", message: "Logged 2h 0m of work", authorName: "Alice Chen", createdAt: "2026-08-23T11:00:00Z" },
    { id: "act-4", type: "WORK_LOGGED", message: "Logged 1h 30m of work", authorName: "Bob Martinez", createdAt: "2026-08-23T15:30:00Z" },
  ]);

  // Modals state
  const [isLogWorkOpen, setIsLogWorkOpen] = useState(false);
  const [logHours, setLogHours] = useState("1");
  const [logMinutes, setLogMinutes] = useState("30");
  const [logDescription, setLogDescription] = useState("");

  const [isAttachCommitOpen, setIsAttachCommitOpen] = useState(false);
  const [commitHash, setCommitHash] = useState("");
  const [commitMsg, setCommitMsg] = useState("");
  const [commitBranch, setCommitBranch] = useState(`feat/${rawId}-oauth-flow`);

  const [acceptedSections, setAcceptedSections] = useState<Set<string>>(new Set(["causes", "criteria"]));
  const [completedSubtasks, setCompletedSubtasks] = useState<Set<number>>(new Set([0]));
  const [copiedBranch, setCopiedBranch] = useState(false);
  const [copiedMarkdownId, setCopiedMarkdownId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [logPreview, setLogPreview] = useState<{ filename: string; content: string } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const originalEstimateMinutes = (issue?.storyPoints || 3) * 240; // 4h per story point
  const totalLoggedMinutes = workLogs.reduce((sum, item) => sum + (item.timeSpentMinutes || 0), 0);
  const remainingMinutes = Math.max(0, originalEstimateMinutes - totalLoggedMinutes);
  const progressPercent = Math.min(100, Math.round((totalLoggedMinutes / originalEstimateMinutes) * 100));

  const handleStatusUpdate = async (newStatus: string) => {
    if (!issue) return;
    setIssue((prev: any) => ({ ...prev, status: newStatus }));
    const targetId = issue.rawId || issue.id || rawId;
    await issueApi.update(targetId, { status: newStatus }).catch(() => {});
    const newAct = {
      id: `act-${Date.now()}`,
      type: "STATUS_CHANGE",
      message: `Status updated to ${newStatus.replace("_", " ")}`,
      authorName: user?.name || "Alice Chen",
      createdAt: new Date().toISOString(),
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const handlePriorityUpdate = async (newPriority: string) => {
    if (!issue) return;
    setIssue((prev: any) => ({ ...prev, priority: newPriority }));
    const targetId = issue.rawId || issue.id || rawId;
    await issueApi.update(targetId, { priority: newPriority }).catch(() => {});
    const newAct = {
      id: `act-${Date.now()}`,
      type: "STATUS_CHANGE",
      message: `Priority updated to ${newPriority}`,
      authorName: user?.name || "Alice Chen",
      createdAt: new Date().toISOString(),
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const handleDeleteIssue = async () => {
    if (!issue) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete ticket ${issue.id}? This action cannot be undone.`);
    if (!confirmDelete) return;
    setDeletingIssue(true);
    try {
      const targetId = issue.rawId || issue.id || rawId;
      await issueApi.delete(targetId);
      router.push("/dashboard/issues");
    } catch (err: any) {
      alert("Failed to delete issue: " + (err?.message || "Permission denied"));
      setDeletingIssue(false);
    }
  };

  const handleLogWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseInt(logHours, 10) || 0;
    const m = parseInt(logMinutes, 10) || 0;
    const totalMins = h * 60 + m;
    if (totalMins <= 0) return;

    const currentUserName = user?.name || "Alice Chen";
    const currentUserId = user?.id || "usr_alice";
    const targetId = issue.rawId || issue.id || rawId;

    const newLog = {
      id: `wl-${Date.now()}`,
      timeSpentMinutes: totalMins,
      description: logDescription.trim() || "Work log update",
      user: { name: currentUserName, role: "Engineering Lead" },
      createdAt: new Date().toISOString(),
    };

    setWorkLogs((prev) => [newLog, ...prev]);
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        type: "WORK_LOGGED",
        message: `Logged ${h}h ${m}m of work (${logDescription.trim() || "Work log update"})`,
        authorName: currentUserName,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    // Persist to API
    issueApi.logTime(targetId, totalMins, logDescription).catch(() => {});

    setIsLogWorkOpen(false);
    setLogHours("1");
    setLogMinutes("0");
    setLogDescription("");
  };

  const handleAttachCommitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitHash.trim() || !commitMsg.trim()) return;

    const currentUserName = user?.name || "Alice Chen";
    const targetId = issue.rawId || issue.id || rawId;
    const cleanHash = commitHash.trim().slice(0, 7);
    const newCommit = {
      id: `gc-${Date.now()}`,
      hash: cleanHash,
      message: commitMsg.trim(),
      authorName: currentUserName,
      branch: commitBranch.trim() || `feat/${issue.id}`,
      url: `https://github.com/devflow-org/core-api/commit/${cleanHash}`,
      createdAt: new Date().toISOString(),
    };

    setGitCommits((prev) => [newCommit, ...prev]);
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        type: "COMMIT_ATTACHED",
        message: `Git Commit ${cleanHash} attached ("${commitMsg.trim()}")`,
        authorName: currentUserName,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    // Persist to API
    issueApi.attachCommit(targetId, {
      hash: cleanHash,
      message: commitMsg.trim(),
      branch: commitBranch.trim(),
      authorName: currentUserName,
    }).catch(() => {});

    setIsAttachCommitOpen(false);
    setCommitHash("");
    setCommitMsg("");
  };

  const toggleAccepted = (section: string) => {
    setAcceptedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const toggleSubtask = (idx: number) => {
    setCompletedSubtasks((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isPostingComment) return;

    const contentText = newComment.trim();
    const currentUserName = user?.name || "Alice Chen";
    const currentUserId = user?.id || "usr_alice";
    const targetIssueId = issue.rawId || issue.id || rawId;

    setIsPostingComment(true);

    const tempId = `c-${Date.now()}`;
    const comment = {
      id: tempId,
      issueId: targetIssueId,
      content: contentText,
      author: { id: currentUserId, name: currentUserName, avatar: user?.avatar || null },
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, comment]);
    setNewComment("");

    // Add to activity timeline
    const newAct = {
      id: `act-${Date.now()}`,
      type: "COMMENT",
      message: `Commented: "${contentText.length > 45 ? contentText.slice(0, 45) + "..." : contentText}"`,
      authorName: currentUserName,
      createdAt: new Date().toISOString(),
    };
    setActivities((prev) => [newAct, ...prev]);

    try {
      // 1. Save to backend API
      const res = await commentApi.create(targetIssueId, contentText).catch(() => null);
      if (res?.success && res.data?.id) {
        setComments((prev) =>
          prev.map((c) => (c.id === tempId ? { ...c, id: res.data.id } : c))
        );
      }
    } catch (err) {
      console.warn("Comment creation notice:", err);
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    try {
      await commentApi.delete(commentId).catch(() => null);
    } catch (err) {
      console.warn("Comment deletion notice:", err);
    }
  };

  const handleCopyBranch = () => {
    const prefix = issue.type === "BUG" ? "fix" : "feat";
    const slug = issue.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);
    const branchCmd = `git checkout -b ${prefix}/${issue.id}-${slug}`;
    navigator.clipboard.writeText(branchCmd);
    setCopiedBranch(true);
    setTimeout(() => setCopiedBranch(false), 2000);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Attempt API upload
        const res = await attachmentApi.upload(issue.id, file).catch(() => null);

        if (res?.data?.attachment) {
          const newAtt = {
            id: res.data.attachment.id,
            filename: res.data.attachment.filename,
            url: res.data.attachment.url,
            mimeType: res.data.attachment.mimeType || file.type,
            size: res.data.attachment.size || file.size,
            createdAt: res.data.attachment.createdAt,
            uploaderName: res.data.attachment.uploader?.name || "Alice Chen",
          };
          setAttachments((prev) => [newAtt, ...prev]);
        } else {
          // Optimistic local object URL preview fallback
          const objectUrl = URL.createObjectURL(file);
          const newAtt = {
            id: `att-${Date.now()}-${i}`,
            filename: file.name,
            url: objectUrl,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            createdAt: new Date().toISOString(),
            uploaderName: "Alice Chen (You)",
          };
          setAttachments((prev) => [newAtt, ...prev]);
        }
      } catch (err) {
        console.warn("Upload failed:", err);
      }
    }

    setIsUploading(false);
  };

  const handleDeleteAttachment = async (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    await attachmentApi.delete(id).catch(() => null);
  };

  const handleCopyMarkdown = (att: LocalAttachment) => {
    const isImg = att.mimeType.startsWith("image/");
    const snippet = isImg ? `![${att.filename}](${att.url})` : `[📎 ${att.filename}](${att.url})`;
    navigator.clipboard.writeText(snippet);
    setCopiedMarkdownId(att.id);
    setTimeout(() => setCopiedMarkdownId(null), 2000);
  };

  const handleInspectLog = (att: LocalAttachment) => {
    setLogPreview({
      filename: att.filename,
      content: `[2026-08-22 14:15:02.341] [ERROR] [CheckoutService] Failed to validate discount token: SAVE20
Error: Invalid minimum spend calculation in CartValidator.ts:142
    at validateCoupon (webpack-internal:///./src/services/coupon.ts:48:15)
    at processDiscount (webpack-internal:///./src/services/checkout.ts:112:22)
    at async handleApplyDiscount (webpack-internal:///./src/routes/cart.ts:89:9)
[2026-08-22 14:15:02.345] [WARN] [AuditLogger] Transaction aborted for cart_id: 8492019
[2026-08-22 14:15:02.348] [INFO] [Response] 500 Internal Server Error returned to client (took 18.2ms)`,
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in h-[50vh]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <h2 className="text-sm font-semibold text-slate-800">Loading Issue...</h2>
        <p className="text-xs text-slate-500 mt-1">Fetching data from the server</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center h-[50vh]">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4 shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-base font-bold text-slate-900 mb-2">Issue Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mb-6">
          The issue <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">{rawId}</span> does not exist or you don't have permission to view it.
        </p>
        <Link 
          href="/dashboard/issues" 
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-md transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Issues
        </Link>
      </div>
    );
  }

  const statusConfig = ISSUE_STATUS_CONFIG[issue.status as keyof typeof ISSUE_STATUS_CONFIG] || {
    label: issue.status,
    color: "#6366f1",
  };
  const priorityConfig = ISSUE_PRIORITY_CONFIG[issue.priority as keyof typeof ISSUE_PRIORITY_CONFIG] || {
    label: issue.priority,
    color: "#f59e0b",
    icon: "🟡",
  };
  const typeConfig = ISSUE_TYPE_CONFIG[issue.type as keyof typeof ISSUE_TYPE_CONFIG] || {
    label: issue.type,
    icon: "📋",
    color: "#3b82f6",
  };

  const TYPE_ICONS: Record<string, any> = {
    BUG: Bug,
    TASK: ListTodo,
    FEATURE: Rocket,
    STORY: BookOpen,
  };
  const TypeIcon = TYPE_ICONS[issue?.type] || ListTodo;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto text-slate-900 pb-16">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link
            href="/dashboard/issues"
            className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600 font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Issues
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span>{issue.project.name}</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="font-mono font-bold text-indigo-600">{issue.id}</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyBranch}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Copy Git checkout branch command"
          >
            {copiedBranch ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied Branch Command</span>
              </>
            ) : (
              <>
                <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
                <span>Copy Git Branch</span>
              </>
            )}
          </button>

          <Link
            href="/dashboard/board"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>View on Board</span>
          </Link>

          {canDeleteIssue && (
            <button
              onClick={handleDeleteIssue}
              disabled={deletingIssue}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 hover:text-rose-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              title="Delete Issue (Admin / Project Manager only)"
            >
              {deletingIssue ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>{deletingIssue ? "Deleting..." : "Delete"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Issue Title & Status Badges */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            {issue.id}
          </span>

          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border"
            style={{
              background: `${typeConfig.color}15`,
              color: typeConfig.color,
              borderColor: `${typeConfig.color}35`,
            }}
          >
            <TypeIcon className="w-3.5 h-3.5" />
            {typeConfig.label}
          </span>

          {/* Interactive Status Selector */}
          <div className="relative inline-block">
            <select
              value={issue.status}
              disabled={!canEditIssue}
              title={!canEditIssue ? `Status editing restricted for ${userRole}` : undefined}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              className={`appearance-none font-semibold text-xs rounded-md pl-3 pr-7 py-1 border transition-colors ${
                !canEditIssue ? "cursor-not-allowed opacity-75" : "cursor-pointer focus:outline-none"
              }`}
              style={{
                background: `${statusConfig.color}15`,
                color: statusConfig.color,
                borderColor: `${statusConfig.color}40`,
              }}
            >
              <option value="BACKLOG">Backlog</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          {/* Interactive Priority Selector */}
          <div className="relative inline-block">
            <select
              value={issue.priority}
              disabled={!canEditIssue}
              title={!canEditIssue ? `Priority editing restricted for ${userRole}` : undefined}
              onChange={(e) => handlePriorityUpdate(e.target.value)}
              className={`appearance-none font-semibold text-xs rounded-md pl-3 pr-7 py-1 border transition-colors ${
                !canEditIssue ? "cursor-not-allowed opacity-75" : "cursor-pointer focus:outline-none"
              }`}
              style={{
                background: `${priorityConfig.color}15`,
                color: priorityConfig.color,
                borderColor: `${priorityConfig.color}40`,
              }}
            >
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="CRITICAL">Critical Priority</option>
            </select>
          </div>

          <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Updated {issue.updatedAt}
          </span>
        </div>

        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
          {issue.title}
        </h1>
      </div>

      {/* Read-Only Notice for Viewers */}
      {isViewer && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium animate-fade-in">
          <Eye className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            <strong>Read-Only Mode:</strong> Your role ({userRole}) has view privileges on ticket <strong>{issue.id}</strong>. Status modification, description editing, and file uploads are disabled.
          </span>
        </div>
      )}

      {/* 2-Column Main Layout: Issue Details (Left 60%) + AI Copilot (Right 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Description, Metadata, Attachments, Comments */}
        <div className="lg:col-span-7 space-y-6">
          {/* Description Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Description &amp; Specifications
              </h3>
              {!isEditingDesc ? (
                canEditIssue && (
                  <button
                    onClick={() => {
                      setEditedDesc(issue.description || "");
                      setIsEditingDesc(true);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 hover:bg-indigo-50 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Specifications</span>
                  </button>
                )
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingDesc(false)}
                    className="text-xs text-slate-500 hover:text-slate-700 font-medium px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDescription}
                    disabled={savingDesc}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1 rounded-md shadow-2xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{savingDesc ? "Saving..." : "Save"}</span>
                  </button>
                </div>
              )}
            </div>

            {isEditingDesc ? (
              <div className="space-y-2 pt-1">
                <textarea
                  value={editedDesc}
                  onChange={(e) => setEditedDesc(e.target.value)}
                  placeholder="Add detailed task description, engineering specifications, acceptance criteria, and reproduction steps..."
                  rows={8}
                  className="w-full text-xs text-slate-800 p-3.5 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono leading-relaxed bg-slate-50/50"
                />
              </div>
            ) : (
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-normal">
                {issue.description ? (
                  issue.description
                ) : (
                  <div className="py-6 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                    <p className="text-slate-500 text-xs">No technical specifications provided yet.</p>
                    <button
                      onClick={() => {
                        setEditedDesc(
                          `### Technical Specifications & Requirements\n• Implementation details for ticket ${issue.id}\n• API parameter validation and error handling\n\n### Acceptance Criteria\n- [ ] Unit tests pass with 100% assertions\n- [ ] PR linked and verified on GitHub`
                        );
                        setIsEditingDesc(true);
                      }}
                      className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
                    >
                      + Generate Specifications Template
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Metadata Grid Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Context & Assignments
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[11px] text-slate-500 font-medium mb-1">Assignee</p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-2xs"
                    style={{ background: "linear-gradient(135deg, #4f46e5, #3b82f6)" }}
                  >
                    {issue.assignee?.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {issue.assignee?.name}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] text-slate-500 font-medium mb-1">Reporter</p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-2xs"
                    style={{ background: "linear-gradient(135deg, #f97316, #ef4444)" }}
                  >
                    {issue.reporter?.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {issue.reporter?.name}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] text-slate-500 font-medium mb-1">Sprint</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  {issue.sprint?.name}
                </span>
              </div>

              <div>
                <p className="text-[11px] text-slate-500 font-medium mb-1">Story Points</p>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-700">
                  {issue.storyPoints || 3} pts
                </span>
              </div>
            </div>

            {/* Labels */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                Labels:
              </span>
              {issue.labels?.map((label: any) => (
                <span
                  key={label.id}
                  className="px-2 py-0.5 rounded-md text-[11px] font-semibold border"
                  style={{
                    background: `${label.color}15`,
                    color: label.color,
                    borderColor: `${label.color}35`,
                  }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          </div>

          {/* Time Tracking Meter Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Time Tracking &amp; Meter
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Logged work vs estimated story point allocation
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLogWorkOpen(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Log Work</span>
                </button>

                <button
                  onClick={() => setIsAttachCommitOpen(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <GitCommitIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Attach Commit</span>
                </button>
              </div>
            </div>

            {/* Time Tracking Meter Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 flex items-center gap-1">
                  Logged: <span className="font-mono text-emerald-600 font-bold">{Math.floor(totalLoggedMinutes / 60)}h {totalLoggedMinutes % 60}m</span>
                </span>
                <span className="text-slate-500 font-mono">
                  {progressPercent}% of {Math.floor(originalEstimateMinutes / 60)}h estimate
                </span>
                <span className="text-slate-700 flex items-center gap-1">
                  Remaining: <span className="font-mono text-indigo-600 font-bold">{Math.floor(remainingMinutes / 60)}h {remainingMinutes % 60}m</span>
                </span>
              </div>

              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/60 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Interactive Tabs: Comments | Attachments | Subtasks | Activity */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="flex border-b border-slate-200 bg-slate-50/70 overflow-x-auto">
              <button
                onClick={() => setActiveTab("comments")}
                className={`px-4 py-3 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === "comments"
                    ? "text-indigo-600 border-b-2 border-indigo-600 bg-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Discussion ({comments.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("commits")}
                className={`px-4 py-3 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === "commits"
                    ? "text-indigo-600 border-b-2 border-indigo-600 bg-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <GitCommitIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Git Commits ({gitCommits.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("worklogs")}
                className={`px-4 py-3 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === "worklogs"
                    ? "text-indigo-600 border-b-2 border-indigo-600 bg-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Timer className="w-3.5 h-3.5 text-emerald-600" />
                <span>Work Logs ({workLogs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("attachments")}
                className={`px-4 py-3 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === "attachments"
                    ? "text-indigo-600 border-b-2 border-indigo-600 bg-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Files &amp; Logs ({attachments.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("subtasks")}
                className={`px-4 py-3 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === "subtasks"
                    ? "text-indigo-600 border-b-2 border-indigo-600 bg-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>
                  Checklist ({completedSubtasks.size}/{issue.aiAnalysis?.suggestedSubtasks?.length || 0})
                </span>
              </button>

              <button
                onClick={() => setActiveTab("activity")}
                className={`px-4 py-3 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === "activity"
                    ? "text-indigo-600 border-b-2 border-indigo-600 bg-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Audit Activity</span>
              </button>
            </div>

            <div className="p-5">
              {/* TAB 1: Discussion */}
              {activeTab === "comments" && (
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <MessageSquare className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                      <p className="text-xs font-semibold text-slate-700">No discussion comments yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Post the first update or question below to collaborate with your team.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((c: any) => {
                        const authorName = c.author?.name || c.authorName || "Team Member";
                        const authorInit = authorName[0]?.toUpperCase() || "U";
                        const timeStr = c.createdAt
                          ? new Date(c.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Just now";

                        return (
                          <div
                            key={c.id}
                            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 group hover:border-slate-300 transition-colors shadow-2xs"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[9px] shadow-2xs">
                                  {authorInit}
                                </div>
                                <span className="font-semibold text-slate-900">{authorName}</span>
                                <span className="text-[10px] text-slate-400">{timeStr}</span>
                              </div>
                              <button
                                onClick={() => handleDeleteComment(c.id)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-1 rounded hover:bg-white cursor-pointer"
                                title="Delete comment"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="leading-relaxed text-slate-700 whitespace-pre-wrap pl-7">{c.content}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add Comment Form */}
                  <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment or mention @team..."
                      disabled={isPostingComment}
                      className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400 shadow-2xs transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim() || isPostingComment}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      {isPostingComment ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>{isPostingComment ? "Posting..." : "Post"}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 2: File Attachments & Reproduction Artifacts (Phase 20) */}
              {activeTab === "attachments" && (
                <div className="space-y-5">
                  {/* Drag & Drop Upload Zone */}
                  {canUploadAttachments ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(true);
                      }}
                      onDragLeave={() => setIsDraggingOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(false);
                        handleFileUpload(e.dataTransfer.files);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                        isDraggingOver
                          ? "border-indigo-500 bg-indigo-50/50"
                          : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={(e) => handleFileUpload(e.target.files)}
                        className="hidden"
                        accept="image/*,.log,.txt,.json,.csv,.pdf"
                      />

                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                        {isUploading ? (
                          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <UploadCloud className="w-5 h-5" />
                        )}
                      </div>

                      <p className="text-xs font-bold text-slate-800 mb-0.5">
                        {isUploading ? "Uploading files..." : "Click or drag error logs & screenshots here"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Supports PNG, JPG, WebP, .log, .txt, .json, and PDF up to 10MB
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center font-medium">
                      Attachment uploads are restricted for {userRole} role. You can preview and download existing artifacts below.
                    </div>
                  )}

                  {/* Attachment Cards Grid */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Attached Artifacts ({attachments.length})
                    </h4>

                    {attachments.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-3 text-center">
                        No files or logs attached yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {attachments.map((att) => {
                          const isImg = att.mimeType.startsWith("image/");
                          const isLog = att.mimeType.includes("log") || att.filename.endsWith(".log") || att.filename.endsWith(".txt");

                          return (
                            <div
                              key={att.id}
                              className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-indigo-300 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                            >
                              <div className="flex items-start gap-3">
                                {/* Thumbnail or File Icon */}
                                {isImg ? (
                                  <div
                                    onClick={() => setLightboxImage(att.url)}
                                    className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0 relative group cursor-pointer border border-slate-300"
                                  >
                                    <img
                                      src={att.url}
                                      alt={att.filename}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <Maximize2 className="w-3.5 h-3.5 text-white" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0 text-indigo-600">
                                    {isLog ? <FileCode className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                  </div>
                                )}

                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-slate-900 truncate" title={att.filename}>
                                    {att.filename}
                                  </p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">
                                    {formatFileSize(att.size)} &bull; {att.uploaderName}
                                  </p>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                                <div className="flex items-center gap-1.5">
                                  {isImg && (
                                    <button
                                      onClick={() => setLightboxImage(att.url)}
                                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-semibold text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                      <Maximize2 className="w-3 h-3 text-indigo-600" />
                                      Preview
                                    </button>
                                  )}

                                  {isLog && (
                                    <button
                                      onClick={() => handleInspectLog(att)}
                                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-semibold text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                      <FileCode className="w-3 h-3 text-indigo-600" />
                                      Inspect Log
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleCopyMarkdown(att)}
                                    title="Copy Markdown embed snippet"
                                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-semibold text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    {copiedMarkdownId === att.id ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        <span className="text-emerald-700">Copied MD</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3 text-slate-500" />
                                        <span>Copy MD</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                                <button
                                  onClick={() => handleDeleteAttachment(att.id)}
                                  title="Delete attachment"
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Subtasks Checklist */}
              {activeTab === "subtasks" && (
                <div className="space-y-2">
                  {issue.aiAnalysis?.suggestedSubtasks?.map((task: string, idx: number) => {
                    const isDone = completedSubtasks.has(idx);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleSubtask(idx)}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                          isDone
                            ? "bg-emerald-50/60 border-emerald-200 text-slate-500 line-through"
                            : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => toggleSubtask(idx)}
                          className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                        />
                        <span>{task}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB: Git Commits */}
              {activeTab === "commits" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Linked Commit Attachments ({gitCommits.length})
                    </h4>
                    <button
                      onClick={() => setIsAttachCommitOpen(true)}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-semibold flex items-center gap-1 border border-indigo-200 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Attach Commit
                    </button>
                  </div>

                  {gitCommits.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-6">
                      No Git commits linked to this issue yet.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {gitCommits.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                              <GitCommitIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-indigo-600 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                                  {c.hash}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-200 text-[10px] font-mono text-slate-700">
                                  {c.branch}
                                </span>
                              </div>
                              <p className="font-semibold text-slate-900 mt-1 truncate">
                                {c.message}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Committed by <span className="font-semibold">{c.authorName}</span> &bull; {new Date(c.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {c.url && (
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition-colors shrink-0"
                              title="View on GitHub"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: Work Logs */}
              {activeTab === "worklogs" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Work Log Entries ({workLogs.length})
                    </h4>
                    <button
                      onClick={() => setIsLogWorkOpen(true)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-xs font-semibold flex items-center gap-1 border border-emerald-200 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Log Time
                    </button>
                  </div>

                  {workLogs.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-6">
                      No time logged on this issue yet.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {workLogs.map((wl) => {
                        const hours = Math.floor(wl.timeSpentMinutes / 60);
                        const mins = wl.timeSpentMinutes % 60;
                        return (
                          <div
                            key={wl.id}
                            className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                                {wl.user?.name[0] || "U"}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {wl.description || "Work log entry"}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  Logged by <span className="font-medium text-slate-700">{wl.user?.name}</span> &bull; {new Date(wl.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              {hours > 0 ? `${hours}h ` : ""}{mins}m
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Audit Activity Timeline */}
              {activeTab === "activity" && (
                <div className="space-y-3 text-xs text-slate-600">
                  {activities.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 pb-3 border-b border-slate-100">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        act.type === "WORK_LOGGED"
                          ? "bg-emerald-100 text-emerald-700"
                          : act.type === "COMMIT_ATTACHED"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-purple-100 text-purple-700"
                      }`}>
                        {act.type === "WORK_LOGGED" ? (
                          <Timer className="w-3.5 h-3.5" />
                        ) : act.type === "COMMIT_ATTACHED" ? (
                          <GitCommitIcon className="w-3.5 h-3.5" />
                        ) : (
                          <Activity className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800">{act.message}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          By {act.authorName} &bull; {new Date(act.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Copilot Insights (40%) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gradient-to-b from-purple-50/60 to-white rounded-xl border border-purple-200/80 p-5 shadow-2xs space-y-4 sticky top-6">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Copilot Analysis</h3>
                  <p className="text-[10px] text-purple-700 font-semibold">
                    {Math.round((issue.aiAnalysis?.confidence || 0.95) * 100)}% Confidence Match
                  </p>
                </div>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="p-3 bg-purple-50/80 rounded-lg border border-purple-200/60 text-xs text-purple-900 leading-relaxed font-normal">
              <span className="font-bold">Triage Reasoning: </span>
              {issue.aiAnalysis?.reasoning}
            </div>

            {/* Possible Causes */}
            <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Identified Causes
                </span>
                <button
                  onClick={() => toggleAccepted("causes")}
                  className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                    acceptedSections.has("causes")
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {acceptedSections.has("causes") ? "✓ Accepted" : "+ Accept"}
                </button>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {issue.aiAnalysis?.possibleCauses?.map((c: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-purple-600 font-bold">&bull;</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Acceptance Criteria */}
            <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5 text-indigo-600" />
                  Acceptance Criteria
                </span>
                <button
                  onClick={() => toggleAccepted("criteria")}
                  className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                    acceptedSections.has("criteria")
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {acceptedSections.has("criteria") ? "✓ Accepted" : "+ Accept"}
                </button>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {issue.aiAnalysis?.acceptanceCriteria?.map((ac: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{ac}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Reproduction Steps */}
            <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Footprints className="w-3.5 h-3.5 text-emerald-600" />
                Reproduction Steps
              </span>
              <ol className="space-y-1 text-xs text-slate-600 list-decimal list-inside">
                {issue.aiAnalysis?.reproductionSteps?.map((step: string, i: number) => (
                  <li key={i} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL 1: Image Lightbox Fullscreen Preview ─── */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage}
              alt="Screenshot Preview"
              className="max-h-[85vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Inline Log Viewer Modal ─── */}
      {logPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-mono font-bold text-slate-100">
                  {logPreview.filename}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(logPreview.content);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  Copy Log
                </button>
                <button
                  onClick={() => setLogPreview(null)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Code Content */}
            <div className="p-5 overflow-auto flex-1 font-mono text-xs leading-relaxed text-emerald-400 bg-slate-950/80 whitespace-pre-wrap select-text">
              {logPreview.content}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: Log Work Dialog Modal ─── */}
      {isLogWorkOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Log Time Worked</h3>
              </div>
              <button
                onClick={() => setIsLogWorkOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogWorkSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={logHours}
                    onChange={(e) => setLogHours(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={logMinutes}
                    onChange={(e) => setLogMinutes(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work Log Notes</label>
                <textarea
                  rows={3}
                  value={logDescription}
                  onChange={(e) => setLogDescription(e.target.value)}
                  placeholder="Summary of work completed during this session..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 text-slate-800 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogWorkOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Save Work Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: Attach Commit Dialog Modal ─── */}
      {isAttachCommitOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <GitCommitIcon className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Attach Git Commit</h3>
              </div>
              <button
                onClick={() => setIsAttachCommitOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAttachCommitSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Commit Hash (SHA)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. a4f8b1c"
                  value={commitHash}
                  onChange={(e) => setCommitHash(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Commit Message</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. feat(auth): implement PKCE code verifier"
                  value={commitMsg}
                  onChange={(e) => setCommitMsg(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  value={commitBranch}
                  onChange={(e) => setCommitBranch(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAttachCommitOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Attach Commit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
