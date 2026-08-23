"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useUiStore } from "@/lib/store";
import { useRealtime } from "@/lib/useRealtime";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  MoreHorizontal,
  GripVertical,
  Bug,
  ListTodo,
  Rocket,
  BookOpen,
  Filter,
  Search,
  Timer,
  ChevronUp,
  ChevronsUp,
  GitBranch,
  Check,
  Paperclip,
  Zap,
  Wifi,
  Sparkles,
} from "lucide-react";
import {
  KANBAN_COLUMNS,
  ISSUE_STATUS_CONFIG,
  ISSUE_PRIORITY_CONFIG,
  ISSUE_TYPE_CONFIG,
} from "@devflow/shared";

// ─── Types ──────────────────────────────────────
interface KanbanIssue {
  id: string;
  number: number;
  title: string;
  type: string;
  status: string;
  priority: string;
  position: number;
  attachmentsCount?: number;
  assignee: { id: string; name: string; avatar: string | null } | null;
  labels: { id: string; name: string; color: string }[];
}

// ─── Mock Data ──────────────────────────────────
const MOCK_ISSUES: KanbanIssue[] = [
  {
    id: "1", number: 1, title: "Checkout crashes when user applies SAVE20 coupon", type: "BUG", status: "IN_PROGRESS", priority: "HIGH", position: 0, attachmentsCount: 2,
    assignee: { id: "u2", name: "Bob Martinez", avatar: null },
    labels: [{ id: "l1", name: "checkout", color: "#ef4444" }, { id: "l8", name: "coupon", color: "#f59e0b" }],
  },
  {
    id: "2", number: 2, title: "Cart total shows negative value with multiple discounts", type: "BUG", status: "TODO", priority: "CRITICAL", position: 0, attachmentsCount: 1,
    assignee: { id: "u2", name: "Bob Martinez", avatar: null },
    labels: [{ id: "l9", name: "cart", color: "#0d9488" }, { id: "l1", name: "checkout", color: "#ef4444" }],
  },
  {
    id: "3", number: 3, title: "Implement product search with filters", type: "FEATURE", status: "BACKLOG", priority: "MEDIUM", position: 0,
    assignee: null,
    labels: [{ id: "l10", name: "search", color: "#7c3aed" }, { id: "l5", name: "ui", color: "#0284c7" }],
  },
  {
    id: "4", number: 4, title: "Payment gateway timeout after 30 seconds", type: "BUG", status: "IN_REVIEW", priority: "HIGH", position: 0,
    assignee: { id: "u1", name: "Alice Chen", avatar: null },
    labels: [{ id: "l2", name: "payment", color: "#ea580c" }, { id: "l4", name: "api", color: "#2563eb" }],
  },
  {
    id: "5", number: 5, title: "Add order tracking page with live status updates", type: "FEATURE", status: "TODO", priority: "MEDIUM", position: 1,
    assignee: { id: "u2", name: "Bob Martinez", avatar: null },
    labels: [{ id: "l5", name: "ui", color: "#0284c7" }],
  },
  {
    id: "6", number: 6, title: "Optimize product catalog image caching & responsive loading", type: "TASK", status: "DONE", priority: "LOW", position: 0,
    assignee: { id: "u1", name: "Alice Chen", avatar: null },
    labels: [{ id: "l6", name: "performance", color: "#16a34a" }],
  },
  {
    id: "7", number: 7, title: "Fix login session not persisting after page refresh", type: "BUG", status: "DONE", priority: "HIGH", position: 1,
    assignee: { id: "u1", name: "Alice Chen", avatar: null },
    labels: [{ id: "l3", name: "auth", color: "#7c3aed" }],
  },
  {
    id: "8", number: 8, title: "Add rate limiting to authentication endpoints", type: "TASK", status: "IN_PROGRESS", priority: "MEDIUM", position: 1,
    assignee: { id: "u1", name: "Alice Chen", avatar: null },
    labels: [{ id: "l7", name: "security", color: "#db2777" }, { id: "l4", name: "api", color: "#2563eb" }],
  },
  {
    id: "9", number: 9, title: "As a user, I want to save items to a wishlist", type: "STORY", status: "BACKLOG", priority: "LOW", position: 1,
    assignee: null,
    labels: [{ id: "l5", name: "ui", color: "#0284c7" }],
  },
  {
    id: "10", number: 10, title: "API response time exceeds 500ms for product listing", type: "BUG", status: "TODO", priority: "MEDIUM", position: 2,
    assignee: { id: "u4", name: "David Kim", avatar: null },
    labels: [{ id: "l4", name: "api", color: "#2563eb" }, { id: "l6", name: "performance", color: "#16a34a" }],
  },
];

const TYPE_ICONS: Record<string, any> = {
  BUG: Bug,
  TASK: ListTodo,
  FEATURE: Rocket,
  STORY: BookOpen,
};

// ─── Sortable Card Component ────────────────────
function SortableCard({ issue }: { issue: KanbanIssue }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id, data: { status: issue.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <IssueCard issue={issue} dragListeners={listeners} />
    </div>
  );
}

// ─── Issue Card Component ───────────────────────
function IssueCard({
  issue,
  dragListeners,
  isOverlay,
}: {
  issue: KanbanIssue;
  dragListeners?: any;
  isOverlay?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const TypeIcon = TYPE_ICONS[issue.type] || ListTodo;
  const typeConfig = ISSUE_TYPE_CONFIG[issue.type as keyof typeof ISSUE_TYPE_CONFIG];

  const handleCopyBranch = (e: React.MouseEvent) => {
    e.stopPropagation();
    const TYPE_PREFIX_MAP: Record<string, string> = {
      BUG: "fix",
      FEATURE: "feat",
      TASK: "chore",
      STORY: "story",
    };
    const prefix = TYPE_PREFIX_MAP[issue.type] || "feat";
    const slug = issue.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);
    const branchCmd = `git checkout -b ${prefix}/PHX-${issue.number}-${slug}`;
    navigator.clipboard.writeText(branchCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition-all cursor-pointer ${
        isOverlay ? "shadow-xl border-indigo-400 rotate-1 scale-102" : ""
      }`}
    >
      {/* Header: Key + Type + Copy Branch + Drag handle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TypeIcon
            className="w-3.5 h-3.5"
            style={{ color: typeConfig?.color || "#64748b" }}
          />
          <Link
            href={`/dashboard/issues/PHX-${issue.number}`}
            className="text-xs font-mono font-bold text-slate-500 hover:text-indigo-600 hover:underline"
          >
            PHX-{issue.number}
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyBranch}
            title={copied ? "Copied git checkout command!" : "Copy git branch command"}
            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <GitBranch className="w-3.5 h-3.5" />
            )}
          </button>
          <button className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          <button {...dragListeners} className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-grab active:cursor-grabbing transition-colors">
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h4 className="text-xs font-semibold text-slate-900 leading-snug mb-3 line-clamp-2">
        <Link
          href={`/dashboard/issues/PHX-${issue.number}`}
          className="hover:text-indigo-600 transition-colors"
        >
          {issue.title}
        </Link>
      </h4>

      {/* Labels */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {issue.labels.map((label) => (
          <span
            key={label.id}
            className="px-2 py-0.5 rounded-md text-[10px] font-semibold border"
            style={{
              background: `${label.color}10`,
              color: label.color,
              borderColor: `${label.color}30`,
            }}
          >
            {label.name}
          </span>
        ))}
      </div>

      {/* Footer: Priority + Assignee */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1">
          {issue.priority === "CRITICAL" && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
              <ChevronsUp className="w-3 h-3" /> Critical
            </span>
          )}
          {issue.priority === "HIGH" && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
              <ChevronUp className="w-3 h-3" /> High
            </span>
          )}
          {issue.priority === "MEDIUM" && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
              <ChevronUp className="w-3 h-3" /> Med
            </span>
          )}
          {issue.priority === "LOW" && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              Low
            </span>
          )}

          {/* Phase 20 Attachment Badge */}
          {Boolean(issue.attachmentsCount && issue.attachmentsCount > 0) && (
            <span
              title={`${issue.attachmentsCount} attachment(s)`}
              className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200"
            >
              <Paperclip className="w-2.5 h-2.5 text-slate-400" />
              <span>{issue.attachmentsCount}</span>
            </span>
          )}
        </div>

        {issue.assignee && (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-2xs"
            style={{
              background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
            }}
            title={issue.assignee.name}
          >
            {issue.assignee.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Kanban Column Component ────────────────────
function KanbanColumn({
  status,
  issues,
}: {
  status: string;
  issues: KanbanIssue[];
}) {
  const config = ISSUE_STATUS_CONFIG[status as keyof typeof ISSUE_STATUS_CONFIG];
  const { openCreateIssue } = useUiStore();

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] bg-slate-100/80 rounded-2xl p-3 border border-slate-200/80">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: config?.color || "#64748b" }}
          />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {config?.label || status}
          </h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200 shadow-2xs">
            {issues.length}
          </span>
        </div>
        <button
          onClick={() => openCreateIssue(status)}
          title={`Add issue to ${config?.label || status}`}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Cards */}
      <SortableContext
        items={issues.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 space-y-2.5 min-h-[220px]">
          {issues.map((issue) => (
            <SortableCard key={issue.id} issue={issue} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Main Board Page ────────────────────────────
export default function BoardPage() {
  const { openCreateIssue } = useUiStore();
  const { isConnected, lastEvent } = useRealtime("p1");
  const [issues, setIssues] = useState<KanbanIssue[]>(MOCK_ISSUES);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [liveToast, setLiveToast] = useState<{ id: string; message: string; time: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [selectedSprint, setSelectedSprint] = useState<string>("Sprint 42");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Real-Time Board Synchronization (Phase 21)
  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === "issue.status_changed" || lastEvent.type === "webhook.status_transition") {
      const { issueId, newStatus } = lastEvent.data;
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i))
      );
      setLiveToast({
        id: Math.random().toString(),
        message: `⚡ Issue ${lastEvent.data.issueKey || issueId} moved to ${newStatus} via live sync`,
        time: "Just now",
      });
      const timer = setTimeout(() => setLiveToast(null), 5000);
      return () => clearTimeout(timer);
    } else if (lastEvent.type === "issue.created") {
      const newIssue = lastEvent.data;
      setIssues((prev) => [
        ...prev,
        {
          id: newIssue.id || Math.random().toString(),
          number: prev.length + 1,
          title: newIssue.title,
          type: newIssue.type || "TASK",
          status: newIssue.status || "BACKLOG",
          priority: newIssue.priority || "MEDIUM",
          position: 0,
          attachmentsCount: 0,
          assignee: null,
          labels: [],
        },
      ]);
      setLiveToast({
        id: Math.random().toString(),
        message: `✨ New Issue Added: ${newIssue.title}`,
        time: "Just now",
      });
      const timer = setTimeout(() => setLiveToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [lastEvent]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const columns = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = issues.filter((issue) => {
      if (priorityFilter !== "ALL" && issue.priority !== priorityFilter) {
        return false;
      }
      if (q) {
        const matchesTitle = issue.title.toLowerCase().includes(q);
        const matchesId = issue.id.toLowerCase().includes(q) || `phx-${issue.number}`.includes(q);
        const matchesLabel = issue.labels?.some((l) => l.name.toLowerCase().includes(q));
        if (!matchesTitle && !matchesId && !matchesLabel) return false;
      }
      return true;
    });

    return KANBAN_COLUMNS.map((status) => ({
      status,
      issues: filtered
        .filter((i) => i.status === status)
        .sort((a, b) => a.position - b.position),
    }));
  }, [issues, searchQuery, priorityFilter]);

  const activeIssue = useMemo(
    () => issues.find((i) => i.id === activeId),
    [issues, activeId]
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const activeIssue = issues.find((i) => i.id === active.id);
    if (!activeIssue) return;

    // Determine new status
    const overIssue = issues.find((i) => i.id === over.id);
    const newStatus = overIssue?.status || activeIssue.status;

    if (activeIssue.status !== newStatus || active.id !== over.id) {
      setIssues((prev) => {
        const updated = prev.map((issue) => {
          if (issue.id === active.id) {
            return { ...issue, status: newStatus };
          }
          return issue;
        });
        return updated;
      });
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto relative">
      {/* Board Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-2xs">
              PHX
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Project Phoenix Kanban</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Projects</span>
            <span>/</span>
            <span>Phoenix</span>
            <span>/</span>
            <span className="font-semibold text-slate-800">Sprint Board</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Phase 21: Real-time Live Sync Indicator */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold shadow-2xs transition-all bg-white border-slate-200">
            {isConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-700">Live Sync</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                <span className="text-slate-500">Connecting...</span>
              </>
            )}
          </div>

          {/* Sprint Selector */}
          <div className="relative">
            <select
              value={selectedSprint}
              onChange={(e) => setSelectedSprint(e.target.value)}
              className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer outline-none focus:border-indigo-500"
            >
              <option value="Sprint 42">Sprint 42 (Active)</option>
              <option value="Sprint 41">Sprint 41 (Previous)</option>
              <option value="Sprint 40">Sprint 40</option>
              <option value="Backlog">Product Backlog</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search board..."
              className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 w-44 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
              >
                &times;
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer ${
                priorityFilter !== "ALL"
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-bold"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{priorityFilter === "ALL" ? "Filter" : priorityFilter}</span>
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 animate-fade-in space-y-1 text-xs">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Filter by Priority
                </div>
                {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPriorityFilter(p);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-medium transition-colors cursor-pointer ${
                      priorityFilter === p
                        ? "bg-indigo-50 text-indigo-700 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{p === "ALL" ? "All Priorities" : p}</span>
                    {priorityFilter === p && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* New Issue */}
          <button
            onClick={() => openCreateIssue()}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Issue
          </button>
        </div>
      </div>

      {/* ─── Kanban Board ───────────────────────── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-5 overflow-x-auto pb-4 pt-1">
          {columns.map(({ status, issues }) => (
            <KanbanColumn
              key={status}
              status={status}
              issues={issues}
            />
          ))}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeIssue ? (
            <IssueCard issue={activeIssue} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Real-time Event Live Toast (Phase 21) */}
      {liveToast && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 bg-slate-900/95 backdrop-blur-xs text-white rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-3 animate-fade-in max-w-md">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Zap className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-white leading-snug">{liveToast.message}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{liveToast.time} &bull; Server-Sent Event</p>
          </div>
          <button
            onClick={() => setLiveToast(null)}
            className="text-slate-400 hover:text-white p-1 text-base cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
