"use client";

import { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { useUiStore } from "@/lib/store";

const MOCK_ISSUES = [
  {
    id: "PHX-1042",
    title: "Implement OAuth2 flow for third-party integrations",
    type: "BUG",
    priority: "critical",
    status: "In Progress",
    statusColor: "bg-amber-50 text-amber-800 border-amber-200",
    assignee: "Alice Chen",
    estimate: 5,
    labels: ["auth", "security", "oauth"],
    updatedAt: "10 mins ago",
    aiConfidence: "98% Match",
  },
  {
    id: "PHX-1089",
    title: "Refactor dashboard metrics service for performance",
    type: "TASK",
    priority: "high",
    status: "To Do",
    statusColor: "bg-slate-100 text-slate-700 border-slate-200",
    assignee: "Bob Martinez",
    estimate: 3,
    labels: ["performance", "backend"],
    updatedAt: "1 hour ago",
    aiConfidence: "92% Match",
  },
  {
    id: "PHX-1104",
    title: "Add AI smart label generator to issue drawer",
    type: "FEATURE",
    priority: "medium",
    status: "In Review",
    statusColor: "bg-purple-50 text-purple-800 border-purple-200",
    assignee: "Carol Zhang",
    estimate: 4,
    labels: ["ai", "ui", "frontend"],
    updatedAt: "2 hours ago",
    aiConfidence: "95% Match",
  },
  {
    id: "PHX-1120",
    title: "Rotate team auth secrets and webhook signing keys",
    type: "TASK",
    priority: "low",
    status: "Done",
    statusColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    assignee: "David Kim",
    estimate: 2,
    labels: ["devops", "security"],
    updatedAt: "1 day ago",
    aiConfidence: "89% Match",
  },
  {
    id: "PHX-998",
    title: "Fix coupon validation race condition on checkout",
    type: "BUG",
    priority: "critical",
    status: "Done",
    statusColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    assignee: "Alice Chen",
    estimate: 3,
    labels: ["checkout", "payment"],
    updatedAt: "2 days ago",
    aiConfidence: "99% Match",
  },
];

export default function IssuesListPage() {
  const { openCreateIssue } = useUiStore();
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<string | null>(null);

  const filtered = MOCK_ISSUES.filter((i) => {
    if (filterPriority && i.priority !== filterPriority) return false;
    if (search) {
      const q = search.toLowerCase();
      return i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Issues & Backlog
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Manage, triage, and prioritize engineering tasks with AI insights
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/board"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <ListTodo className="w-3.5 h-3.5 text-indigo-600" />
            <span>Switch to Kanban</span>
          </Link>
          <button
            onClick={() => openCreateIssue()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Issue</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search issues by title, ID, or label..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-colors shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {["critical", "high", "medium", "low"].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(filterPriority === p ? null : p)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize transition-colors cursor-pointer ${
                filterPriority === p
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-2xs"
              }`}
            >
              {p}
            </button>
          ))}
          {filterPriority && (
            <button
              onClick={() => setFilterPriority(null)}
              className="text-xs text-slate-500 hover:text-slate-800 underline ml-1 font-medium cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Issues Table Card */}
      <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
        <div className="divide-y divide-slate-100">
          {filtered.map((issue) => (
            <div
              key={issue.id}
              className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer"
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
                      {issue.labels.map((l) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}
