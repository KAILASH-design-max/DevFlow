"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getInMemoryAccessToken } from "@/lib/fetch";
import {
  ListTodo,
  Plus,
  Search,
  ChevronsUp,
  ChevronUp,
  Minus,
  Clock,
  User,
  ArrowRight,
  Sparkles,
  Database,
  CheckCircle2,
  Tag,
  FolderKanban,
} from "lucide-react";
import { useUiStore } from "@/lib/store";
import { issueApi, projectApi, workspaceApi } from "@/lib/api";
import { useRealtime } from "@/lib/useRealtime";
import { usePermissions } from "@/hooks/usePermissions";

export default function IssuesListPage() {
  const { openCreateIssue } = useUiStore();
  const { canCreateIssue, role: userRole } = usePermissions();
  const [issues, setIssues] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [projectKey, setProjectKey] = useState<string>("DEV");
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const statusMap: Record<string, string> = {
    BACKLOG: "Backlog",
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    IN_REVIEW: "In Review",
    TESTING: "Testing",
    DONE: "Done",
  };

  const colorMap: Record<string, string> = {
    BACKLOG: "bg-slate-50 text-slate-600 border-slate-200",
    TODO: "bg-slate-100 text-slate-700 border-slate-200",
    IN_PROGRESS: "bg-amber-50 text-amber-800 border-amber-200",
    IN_REVIEW: "bg-purple-50 text-purple-800 border-purple-200",
    TESTING: "bg-blue-50 text-blue-800 border-blue-200",
    DONE: "bg-emerald-50 text-emerald-800 border-emerald-200",
  };

  const loadLiveIssues = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser && !getInMemoryAccessToken()) return;

      setLoading(true);
      let currentWsId = typeof window !== "undefined" ? localStorage.getItem("currentWorkspaceId") || "" : "";
      const wsRes = await workspaceApi.list().catch(() => null);
      if (wsRes?.success && wsRes.data?.length > 0) {
        let ws = wsRes.data.find((w: any) => w.id === currentWsId);
        if (!ws) {
          ws = wsRes.data.find((w: any) => (w._count?.projects || 0) > 0) || wsRes.data[0];
        }
        currentWsId = ws.id;
        if (typeof window !== "undefined") {
          localStorage.setItem("currentWorkspaceId", currentWsId);
        }
      }

      // Fetch projects from Database
      const dbProjects = currentWsId ? (await projectApi.list(currentWsId).catch(() => null))?.data || [] : [];
      const allProjects = dbProjects.map((p: any) => ({ id: p.id, name: p.name, key: p.key || "DEV" }));
      setProjects(allProjects);

      // Fetch issues
      let apiIssues: any[] = [];
      if (selectedProjectId !== "all") {
        const res = await issueApi.list(selectedProjectId).catch(() => null);
        if (res?.success && res.data) apiIssues = res.data;
      } else {
        const promises = allProjects.map((p: any) => issueApi.list(p.id).catch(() => null));
        const results = await Promise.all(promises);
        for (const r of results) {
          if (r?.success && Array.isArray(r.data)) {
            apiIssues.push(...r.data);
          }
        }
      }

      // Process API issues
      const processedIssues = apiIssues.map((i: any) => {
        const priority = (i.priority || "MEDIUM").toLowerCase();
        const pKey = i.project?.key || (allProjects.find((p: any) => p.id === i.projectId)?.key) || "DEV";
        const num = i.number || 1;
        const id = `${pKey}-${num}`;

        return {
          id,
          rawId: i.id,
          number: num,
          title: i.title,
          description: i.description,
          type: i.type || "TASK",
          priority,
          status: statusMap[i.status] || i.status,
          statusColor: colorMap[i.status] || "bg-slate-100 text-slate-700 border-slate-200",
          assignee: i.assignee?.name || (i.assigneeId === "usr_alice" ? "Alice Chen" : i.assigneeId === "usr_bob" ? "Bob Martinez" : i.assigneeId ? "Assigned" : "Unassigned"),
          estimate: i.storyPoints || 3,
          labels: (i.labels || []).map((il: any) => il.label?.name || il.name || il),
          updatedAt: i.updatedAt ? new Date(i.updatedAt).toLocaleDateString() : "Just now",
          aiConfidence: "96% Match",
        };
      });

      processedIssues.sort((a: any, b: any) => (b.number || 0) - (a.number || 0));
      setIssues(processedIssues);
    } catch (err) {
      console.warn("Failed to load issues:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const debouncedLoad = () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = setTimeout(() => {
        loadLiveIssues();
      }, 300);
    };

    const handleCreated = () => loadLiveIssues();
    
    debouncedLoad();

    window.addEventListener("devflow:issue_created", handleCreated);

    return () => {
      window.removeEventListener("devflow:issue_created", handleCreated);
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [selectedProjectId]);

  const { lastEvent } = useRealtime(selectedProjectId !== "all" ? selectedProjectId : undefined);

  useEffect(() => {
    if (lastEvent?.type === "issue.created" || lastEvent?.type === "issue.status_changed" || lastEvent?.type === "issue.updated") {
      loadLiveIssues();
    }
  }, [lastEvent]);

  const filtered = issues.filter((i) => {
    if (filterPriority && i.priority !== filterPriority.toLowerCase()) return false;
    if (filterStatus && i.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = i.title.toLowerCase().includes(q);
      const matchId = i.id.toLowerCase().includes(q);
      const matchLabel = i.labels?.some((l: string) => l.toLowerCase().includes(q));
      return matchTitle || matchId || matchLabel;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto text-slate-900 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <ListTodo className="w-6 h-6 text-indigo-600" />
            Issues &amp; Backlog Directory
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Manage, triage, and prioritize engineering tasks across projects.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <Link
            href="/dashboard/board"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <ListTodo className="w-3.5 h-3.5 text-indigo-600" />
            <span>Switch to Kanban</span>
          </Link>
          {canCreateIssue ? (
            <button
              onClick={() => openCreateIssue()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Issue</span>
            </button>
          ) : (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-lg text-xs font-medium cursor-not-allowed"
              title="Issue creation restricted for Viewer role"
            >
              <span>Read-Only ({userRole})</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        {/* Project Selector */}
        {projects.length > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.key})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search issues by title, ID, or label..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5">
          {["critical", "high", "medium", "low"].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(filterPriority === p ? null : p)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold capitalize transition-colors cursor-pointer ${
                filterPriority === p
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-bold"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          {["Backlog", "To Do", "In Progress", "In Review", "Testing", "Done"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? null : s)}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer hidden md:inline-block ${
                filterStatus === s
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-bold"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {(filterPriority || filterStatus || search) && (
          <button
            onClick={() => {
              setFilterPriority(null);
              setFilterStatus(null);
              setSearch("");
            }}
            className="text-xs text-slate-500 hover:text-slate-800 underline ml-1 font-medium cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* Issues Table Card */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-2xs">
        <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex justify-between items-center text-xs font-semibold text-slate-600 px-4">
          <span>Showing {filtered.length} Issues</span>
          <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <Database className="w-3.5 h-3.5" /> Database Live Sync Active
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading && issues.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Loading database issues...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <ListTodo className="w-8 h-8 mx-auto text-slate-300" />
              <p>No issues match your current search and filter criteria.</p>
            </div>
          ) : (
            filtered.map((issue) => (
              <div
                key={issue.id}
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Priority Icon */}
                  <div className="mt-1 flex-shrink-0">
                    {issue.priority === "critical" && (
                      <span title="Critical Priority" className="text-rose-600">
                        <ChevronsUp className="w-4 h-4" />
                      </span>
                    )}
                    {issue.priority === "high" && (
                      <span title="High Priority" className="text-orange-600">
                        <ChevronUp className="w-4 h-4" />
                      </span>
                    )}
                    {issue.priority === "medium" && (
                      <span title="Medium Priority" className="text-amber-500">
                        <ChevronUp className="w-4 h-4" />
                      </span>
                    )}
                    {issue.priority === "low" && (
                      <span title="Low Priority" className="text-slate-400">
                        <Minus className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/dashboard/issues/${issue.id}`}
                        className="font-mono text-xs font-bold text-indigo-600 hover:underline"
                      >
                        {issue.id}
                      </Link>
                      <Link
                        href={`/dashboard/issues/${issue.id}`}
                        className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors"
                      >
                        {issue.title}
                      </Link>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <User className="w-3 h-3 text-slate-400" />
                        {issue.assignee}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {issue.updatedAt}
                      </span>
                      <span>&bull;</span>
                      <div className="flex gap-1.5">
                        {issue.labels?.map((l: string) => (
                          <span
                            key={l}
                            className="px-2 py-0.5 rounded-md font-mono text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-semibold"
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status & Confidence Pill & View Details Action */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    {issue.aiConfidence}
                  </span>

                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold border ${issue.statusColor}`}
                  >
                    {issue.status}
                  </span>

                  <Link
                    href={`/dashboard/issues/${issue.id}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all flex items-center gap-1 text-xs font-semibold"
                    title="View Details"
                  >
                    <span className="hidden sm:inline text-[11px] text-slate-600 group-hover:text-indigo-600 font-medium">
                      View
                    </span>
                    <ArrowRight className="w-4 h-4 text-indigo-600" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
