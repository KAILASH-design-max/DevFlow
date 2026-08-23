"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
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
} from "lucide-react";
import {
  ISSUE_STATUS_CONFIG,
  ISSUE_PRIORITY_CONFIG,
  ISSUE_TYPE_CONFIG,
} from "@devflow/shared";
import { attachmentApi } from "@/lib/api";

interface LocalAttachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploaderName: string;
}

// Initial mock attachments for rich demo experience
const INITIAL_ATTACHMENTS: LocalAttachment[] = [
  {
    id: "att-1",
    filename: "checkout-crash-stacktrace.log",
    url: "https://raw.githubusercontent.com/facebook/react/main/README.md",
    mimeType: "text/x-log",
    size: 24500,
    createdAt: "2026-08-22T14:15:00Z",
    uploaderName: "Alice Chen",
  },
  {
    id: "att-2",
    filename: "coupon-error-reproduction.png",
    url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80",
    mimeType: "image/png",
    size: 342000,
    createdAt: "2026-08-22T14:30:00Z",
    uploaderName: "Bob Martinez",
  },
];

// Extended dataset of issues so every clicked issue ID resolves properly
const ISSUES_DATABASE: Record<string, any> = {
  "PHX-1042": {
    id: "PHX-1042",
    number: 1042,
    title: "Implement OAuth2 flow for third-party integrations",
    description:
      "Design and build the OAuth2 authorization code grant flow with PKCE for third-party developer integrations.\n\nRequirements:\n1. Support authorization code exchange with state parameter validation\n2. Secure token storage using AES-256 encryption\n3. Rate limiting on the token exchange endpoint\n4. Interactive popup callback window with postMessage support",
    type: "FEATURE",
    status: "IN_PROGRESS",
    priority: "CRITICAL",
    assignee: { id: "u1", name: "Alice Chen", role: "Engineering Lead", avatar: null },
    reporter: { id: "u2", name: "Bob Martinez", role: "Fullstack Engineer", avatar: null },
    project: { id: "p1", name: "Project Phoenix", key: "PHX" },
    labels: [
      { id: "l1", name: "auth", color: "#6366f1" },
      { id: "l2", name: "security", color: "#db2777" },
      { id: "l3", name: "oauth", color: "#7c3aed" },
    ],
    sprint: { id: "s1", name: "Sprint 42" },
    storyPoints: 5,
    dueDate: "2026-08-30",
    createdAt: "2026-08-20T10:30:00Z",
    updatedAt: "10 mins ago",
    comments: [
      {
        id: "c1",
        content: "Implemented the OAuth callback popup handler and token exchange endpoint. Testing PKCE verifier now.",
        author: { id: "u1", name: "Alice Chen", avatar: null },
        createdAt: "2026-08-22T14:30:00Z",
      },
      {
        id: "c2",
        content: "Make sure the redirect URI is strictly whitelisted against the CORS origin config.",
        author: { id: "u4", name: "David Kim", avatar: null },
        createdAt: "2026-08-22T16:15:00Z",
      },
    ],
    aiAnalysis: {
      suggestedCategory: "FEATURE",
      suggestedPriority: "CRITICAL",
      confidence: 0.98,
      reasoning: "Core infrastructure requirement for integrations and third-party apps. High security implications.",
      suggestedLabels: ["auth", "security", "oauth", "api"],
      possibleCauses: [
        "State parameter tampering if CSRF token isn't validated",
        "Token leakage in browser URL bar if popup postMessage is not scoped to origin",
      ],
      reproductionSteps: [
        "Click 'Connect with GitHub' in Settings",
        "Authorize DevFlow on the GitHub consent screen",
        "Verify popup closes and token is securely stored",
      ],
      acceptanceCriteria: [
        "OAuth2 code exchange completes under 500ms",
        "State parameter matches session nonce to prevent CSRF",
        "Access tokens encrypted with AES-256-GCM at rest",
        "Unit tests cover token expiry and refresh cycle",
      ],
      suggestedSubtasks: [
        "Implement state parameter generator with HMAC verification",
        "Add AES-256 token encryption utility",
        "Build OAuth callback landing page with postMessage",
        "Write end-to-end integration test",
      ],
    },
  },
  "PHX-1089": {
    id: "PHX-1089",
    number: 1089,
    title: "Refactor dashboard metrics service for performance",
    description:
      "The dashboard metrics aggregation query currently performs sequential scans across all issue tables. Optimize with materialized counts and Redis caching.",
    type: "TASK",
    status: "TODO",
    priority: "HIGH",
    assignee: { id: "u2", name: "Bob Martinez", role: "Fullstack Engineer", avatar: null },
    reporter: { id: "u1", name: "Alice Chen", role: "Engineering Lead", avatar: null },
    project: { id: "p1", name: "Project Phoenix", key: "PHX" },
    labels: [
      { id: "l4", name: "performance", color: "#16a34a" },
      { id: "l5", name: "backend", color: "#2563eb" },
    ],
    sprint: { id: "s1", name: "Sprint 42" },
    storyPoints: 3,
    dueDate: "2026-09-02",
    createdAt: "2026-08-21T09:00:00Z",
    updatedAt: "1 hour ago",
    comments: [
      {
        id: "c1",
        content: "Benchmarked current query at 280ms on 10k issues. Target is <35ms.",
        author: { id: "u2", name: "Bob Martinez", avatar: null },
        createdAt: "2026-08-21T11:00:00Z",
      },
    ],
    aiAnalysis: {
      suggestedCategory: "TASK",
      suggestedPriority: "HIGH",
      confidence: 0.92,
      reasoning: "Performance optimization on high-traffic landing page directly impacts user experience.",
      suggestedLabels: ["performance", "backend", "cache"],
      possibleCauses: ["Unindexed status and priority column lookups", "N+1 relation loading on user avatars"],
      reproductionSteps: ["Open /dashboard with network tab throttled", "Observe /api/dashboard/stats response latency"],
      acceptanceCriteria: ["Dashboard stats endpoint returns in < 50ms", "Redis cache TTL set to 60s with cache-invalidation"],
      suggestedSubtasks: ["Add composite index on (projectId, status)", "Implement Redis caching layer", "Load test with 50 concurrent requests"],
    },
  },
  "PHX-1104": {
    id: "PHX-1104",
    number: 1104,
    title: "Add AI smart label generator to issue drawer",
    description:
      "Integrate the AI service to automatically propose 3-5 high-relevance labels when a user types an issue title and description.",
    type: "FEATURE",
    status: "IN_REVIEW",
    priority: "MEDIUM",
    assignee: { id: "u3", name: "Carol Zhang", role: "QA Engineer", avatar: null },
    reporter: { id: "u1", name: "Alice Chen", role: "Engineering Lead", avatar: null },
    project: { id: "p1", name: "Project Phoenix", key: "PHX" },
    labels: [
      { id: "l6", name: "ai", color: "#8b5cf6" },
      { id: "l7", name: "ui", color: "#0284c7" },
      { id: "l8", name: "frontend", color: "#ec4899" },
    ],
    sprint: { id: "s1", name: "Sprint 42" },
    storyPoints: 4,
    dueDate: "2026-08-28",
    createdAt: "2026-08-20T15:00:00Z",
    updatedAt: "2 hours ago",
    comments: [
      {
        id: "c1",
        content: "PR #43 opened on GitHub with smart label preview chips.",
        author: { id: "u3", name: "Carol Zhang", avatar: null },
        createdAt: "2026-08-22T15:00:00Z",
      },
    ],
    aiAnalysis: {
      suggestedCategory: "FEATURE",
      suggestedPriority: "MEDIUM",
      confidence: 0.95,
      reasoning: "Productivity enhancement that streamlines issue triaging.",
      suggestedLabels: ["ai", "ui", "frontend"],
      possibleCauses: ["Prompt latency could cause slow UI rendering if not debounced"],
      reproductionSteps: ["Open issue modal", "Type 'Database timeout during backup'", "Observe AI label suggestions appear"],
      acceptanceCriteria: ["Debounced 400ms before calling AI endpoint", "Displays confidence rating percentage on chips"],
      suggestedSubtasks: ["Create AILabelChips UI component", "Connect to /api/ai/analyze-issue endpoint", "Add one-click apply label button"],
    },
  },
  "PHX-1120": {
    id: "PHX-1120",
    number: 1120,
    title: "Rotate team auth secrets and webhook signing keys",
    description:
      "Scheduled bi-monthly security maintenance to rotate JWT signing secret and GitHub webhook HMAC secret tokens.",
    type: "TASK",
    status: "DONE",
    priority: "LOW",
    assignee: { id: "u4", name: "David Kim", role: "DevOps Engineer", avatar: null },
    reporter: { id: "u1", name: "Alice Chen", role: "Engineering Lead", avatar: null },
    project: { id: "p1", name: "Project Phoenix", key: "PHX" },
    labels: [
      { id: "l9", name: "devops", color: "#f97316" },
      { id: "l2", name: "security", color: "#db2777" },
    ],
    sprint: { id: "s1", name: "Sprint 41" },
    storyPoints: 2,
    dueDate: "2026-08-21",
    createdAt: "2026-08-19T08:00:00Z",
    updatedAt: "1 day ago",
    comments: [
      {
        id: "c1",
        content: "All signing keys rotated in production environment. No downtime observed.",
        author: { id: "u4", name: "David Kim", avatar: null },
        createdAt: "2026-08-21T18:00:00Z",
      },
    ],
    aiAnalysis: {
      suggestedCategory: "TASK",
      suggestedPriority: "LOW",
      confidence: 0.89,
      reasoning: "Routine DevOps maintenance task.",
      suggestedLabels: ["devops", "security"],
      possibleCauses: ["Session logout for all users if active refresh tokens are not migrated"],
      reproductionSteps: ["Update .env secret key", "Trigger webhook payload test", "Verify HMAC signature validates"],
      acceptanceCriteria: ["Zero downtime token rotation", "AuditLog records key rotation timestamp"],
      suggestedSubtasks: ["Generate 256-bit entropy secret", "Update production vault", "Verify webhook delivery"],
    },
  },
  "PHX-998": {
    id: "PHX-998",
    number: 998,
    title: "Fix coupon validation race condition on checkout",
    description:
      "When users rapidly double-click 'Apply Coupon', two concurrent discount promises execute, leading to negative cart totals.",
    type: "BUG",
    status: "DONE",
    priority: "CRITICAL",
    assignee: { id: "u1", name: "Alice Chen", role: "Engineering Lead", avatar: null },
    reporter: { id: "u3", name: "Carol Zhang", role: "QA Engineer", avatar: null },
    project: { id: "p1", name: "Project Phoenix", key: "PHX" },
    labels: [
      { id: "l10", name: "checkout", color: "#ef4444" },
      { id: "l11", name: "payment", color: "#eab308" },
    ],
    sprint: { id: "s1", name: "Sprint 41" },
    storyPoints: 3,
    dueDate: "2026-08-18",
    createdAt: "2026-08-16T14:00:00Z",
    updatedAt: "2 days ago",
    comments: [
      {
        id: "c1",
        content: "Added mutex lock on coupon validation transaction in database. Fixed in PR #38.",
        author: { id: "u1", name: "Alice Chen", avatar: null },
        createdAt: "2026-08-18T10:00:00Z",
      },
    ],
    aiAnalysis: {
      suggestedCategory: "BUG",
      suggestedPriority: "CRITICAL",
      confidence: 0.99,
      reasoning: "Financial impact with negative cart totals requires immediate critical patch.",
      suggestedLabels: ["checkout", "payment", "bug"],
      possibleCauses: ["Lack of optimistic concurrency control on cart update", "Unbounded frontend button debouncing"],
      reproductionSteps: ["Add $100 cart items", "Double click Apply SAVE20 within 50ms", "Verify discount is not stacked twice"],
      acceptanceCriteria: ["Only 1 coupon transaction processed per cart", "Button disabled with loading spinner during API call"],
      suggestedSubtasks: ["Add database transaction isolation", "Add frontend debounce lock", "Unit test concurrent apply requests"],
    },
  },
};

// Fallback template for any other numeric or slug IDs
function generateFallbackIssue(id: string) {
  const cleanId = id.toUpperCase();
  const numMatch = id.match(/\d+/);
  const num = numMatch ? parseInt(numMatch[0], 10) : 101;

  return {
    id: cleanId.startsWith("PHX-") ? cleanId : `PHX-${num}`,
    number: num,
    title: `Issue ${cleanId}: Implementation and triage for ticket #${num}`,
    description: `Detailed engineering task for ${cleanId}.\n\nContext & Requirements:\n- Automated GitHub PR status synchronizer enabled\n- AI triage report generated with recommended subtasks and acceptance criteria\n- Branch helper configured for this ticket`,
    type: num % 2 === 0 ? "BUG" : "FEATURE",
    status: num % 3 === 0 ? "IN_REVIEW" : num % 2 === 0 ? "IN_PROGRESS" : "TODO",
    priority: num % 4 === 0 ? "CRITICAL" : "HIGH",
    assignee: { id: "u1", name: "Alice Chen", role: "Engineering Lead", avatar: null },
    reporter: { id: "u2", name: "Bob Martinez", role: "Fullstack Engineer", avatar: null },
    project: { id: "p1", name: "Project Phoenix", key: "PHX" },
    labels: [
      { id: "l1", name: "frontend", color: "#6366f1" },
      { id: "l2", name: "api", color: "#0284c7" },
    ],
    sprint: { id: "s1", name: "Sprint 42" },
    storyPoints: 3,
    dueDate: "2026-09-05",
    createdAt: "2026-08-20T10:00:00Z",
    updatedAt: "Just now",
    comments: [
      {
        id: "c1",
        content: "Issue initialized and linked with DevFlow automation pipeline.",
        author: { id: "u1", name: "Alice Chen", avatar: null },
        createdAt: "2026-08-22T12:00:00Z",
      },
    ],
    aiAnalysis: {
      suggestedCategory: num % 2 === 0 ? "BUG" : "FEATURE",
      suggestedPriority: "HIGH",
      confidence: 0.94,
      reasoning: "AI categorized this item based on pattern matching with recent codebase changes.",
      suggestedLabels: ["api", "frontend", "automation"],
      possibleCauses: ["Edge case validation check needed in controller"],
      reproductionSteps: ["Run test suite: pnpm test", "Inspect related component"],
      acceptanceCriteria: ["All tests pass with 100% assertions", "PR linked and verified on GitHub"],
      suggestedSubtasks: ["Implement core logic", "Write unit tests", "Submit PR with linked issue key"],
    },
  };
}

export default function IssueDetailPage() {
  const params = useParams();
  const rawId = typeof params?.issueId === "string" ? params.issueId : "PHX-1042";

  // Resolve issue data
  const baseData = ISSUES_DATABASE[rawId] || generateFallbackIssue(rawId);

  const [issue] = useState(baseData);
  const [activeTab, setActiveTab] = useState<"comments" | "attachments" | "subtasks" | "activity">("comments");
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<any[]>(baseData.comments || []);
  const [attachments, setAttachments] = useState<LocalAttachment[]>(INITIAL_ATTACHMENTS);
  const [acceptedSections, setAcceptedSections] = useState<Set<string>>(new Set(["causes", "criteria"]));
  const [completedSubtasks, setCompletedSubtasks] = useState<Set<number>>(new Set([0]));
  const [copiedBranch, setCopiedBranch] = useState(false);
  const [copiedMarkdownId, setCopiedMarkdownId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [logPreview, setLogPreview] = useState<{ filename: string; content: string } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      id: `c-${Date.now()}`,
      content: newComment.trim(),
      author: { id: "u-current", name: "Alice Chen (You)", avatar: null },
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, comment]);
    setNewComment("");
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
  const TypeIcon = TYPE_ICONS[issue.type] || ListTodo;

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

          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border"
            style={{
              background: `${statusConfig.color}15`,
              color: statusConfig.color,
              borderColor: `${statusConfig.color}35`,
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: statusConfig.color }}
            />
            {statusConfig.label}
          </span>

          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border"
            style={{
              background: `${priorityConfig.color}15`,
              color: priorityConfig.color,
              borderColor: `${priorityConfig.color}35`,
            }}
          >
            <span>{priorityConfig.icon}</span>
            <span>{priorityConfig.label} Priority</span>
          </span>

          <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Updated {issue.updatedAt}
          </span>
        </div>

        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
          {issue.title}
        </h1>
      </div>

      {/* 2-Column Main Layout: Issue Details (Left 60%) + AI Copilot (Right 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Description, Metadata, Attachments, Comments */}
        <div className="lg:col-span-7 space-y-6">
          {/* Description Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Description & Specifications
            </h3>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-normal">
              {issue.description}
            </div>
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
                onClick={() => setActiveTab("attachments")}
                className={`px-4 py-3 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === "attachments"
                    ? "text-indigo-600 border-b-2 border-indigo-600 bg-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Files & Logs ({attachments.length})</span>
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
                  <div className="space-y-3">
                    {comments.map((c: any) => (
                      <div
                        key={c.id}
                        className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-800"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[9px]">
                              {c.author.name[0]}
                            </span>
                            {c.author.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(c.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="leading-relaxed text-slate-700">{c.content}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment Form */}
                  <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment or mention @team..."
                      className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-900 placeholder:text-slate-400 shadow-2xs"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post</span>
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 2: File Attachments & Reproduction Artifacts (Phase 20) */}
              {activeTab === "attachments" && (
                <div className="space-y-5">
                  {/* Drag & Drop Upload Zone */}
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

              {/* TAB 4: Audit Activity */}
              {activeTab === "activity" && (
                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5 pb-2.5 border-b border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5" />
                    <div>
                      <p className="font-semibold text-slate-800">Status updated to {issue.status}</p>
                      <p className="text-[10px] text-slate-400">Automated by GitHub Webhook Engine</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 pb-2.5 border-b border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5" />
                    <div>
                      <p className="font-semibold text-slate-800">AI analysis scoped and attached</p>
                      <p className="text-[10px] text-slate-400">DevFlow AI Engine &bull; 98% confidence</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 pb-2.5 border-b border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-purple-600 mt-1.5" />
                    <div>
                      <p className="font-semibold text-slate-800">Attachments uploaded</p>
                      <p className="text-[10px] text-slate-400">checkout-crash-stacktrace.log attached</p>
                    </div>
                  </div>
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
    </div>
  );
}
