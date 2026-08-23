"use client";

import { useState } from "react";
import Link from "next/link";
import { useUiStore } from "@/lib/store";
import {
  Bug,
  Zap,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Calendar,
  Filter,
  Plus,
  ChevronUp,
  ChevronsUp,
  Bot,
  Flame,
  ArrowUp,
  Minus,
  CheckSquare,
  Square,
  ChevronDown,
  ListChecks,
  UserPlus,
  Edit3,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface AssignmentIssue {
  id: string;
  title: string;
  priority: "critical" | "high" | "medium" | "low";
  status: string;
  statusColor: string;
  subtasks: Subtask[];
}

const INITIAL_ASSIGNMENTS: AssignmentIssue[] = [
  {
    id: "PHX-1042",
    title: "Implement OAuth2 flow for third-party integrations",
    priority: "critical",
    status: "In Progress",
    statusColor: "bg-amber-50 text-amber-800 border-amber-200",
    subtasks: [
      { id: "st-1", title: "Add Google & GitHub OAuth client keys", completed: true },
      { id: "st-2", title: "Handle JWT refresh loop in token handler", completed: true },
      { id: "st-3", title: "Add staging sandbox integration tests", completed: false },
    ],
  },
  {
    id: "PHX-1089",
    title: "Refactor dashboard metrics service for performance",
    priority: "high",
    status: "To Do",
    statusColor: "bg-slate-100 text-slate-700 border-slate-200",
    subtasks: [
      { id: "st-4", title: "Profile slow Redis cache lookups", completed: true },
      { id: "st-5", title: "Add database composite index on issueId + status", completed: false },
      { id: "st-6", title: "Benchmark API throughput with 10k mock rows", completed: false },
      { id: "st-7", title: "Deploy memory leak patch to staging", completed: false },
    ],
  },
  {
    id: "PHX-1104",
    title: "Add AI smart label generator to issue drawer",
    priority: "medium",
    status: "In Review",
    statusColor: "bg-purple-50 text-purple-800 border-purple-200",
    subtasks: [
      { id: "st-8", title: "Integrate Gemini semantic tagging API", completed: true },
      { id: "st-9", title: "Build UI chip selector for auto-labels", completed: true },
      { id: "st-10", title: "Add confidence score tooltip", completed: true },
      { id: "st-11", title: "Hook with issue creation drawer", completed: true },
      { id: "st-12", title: "Write Jest unit tests for tag reducer", completed: false },
    ],
  },
  {
    id: "PHX-1120",
    title: "Rotate team auth secrets and webhook signing keys",
    priority: "low",
    status: "Done",
    statusColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    subtasks: [
      { id: "st-13", title: "Generate 256-bit AES webhook signing secrets", completed: true },
      { id: "st-14", title: "Notify third-party webhook subscribers", completed: true },
      { id: "st-15", title: "Decommission deprecated 2025 signing keys", completed: true },
    ],
  },
];

const MOCK_METRICS = {
  activeIssues: 124,
  activeIssuesTrend: "+12% vs last sprint",
  velocity: 48,
  velocityStatus: "On track",
  openBugs: 17,
  openBugsStatus: "Stable",
  aiSuggestionsCount: 5,
};

const BURNDOWN_DATA = [
  { day: "Mon", ideal: 50, actual: 48 },
  { day: "Tue", ideal: 40, actual: 42 },
  { day: "Wed", ideal: 30, actual: 34 },
  { day: "Thu", ideal: 20, actual: 21 },
  { day: "Fri", ideal: 10, actual: 12 },
  { day: "Sat", ideal: 5, actual: 4 },
  { day: "Sun", ideal: 0, actual: 0 },
];

const VELOCITY_DATA = [
  { sprint: "Sprint 38", velocity: 38, committed: 42 },
  { sprint: "Sprint 39", velocity: 44, committed: 45 },
  { sprint: "Sprint 40", velocity: 41, committed: 40 },
  { sprint: "Sprint 41", velocity: 52, committed: 50 },
  { sprint: "Sprint 42", velocity: 48, committed: 48 },
];

const RECENT_ACTIVITIES = [
  {
    id: "1",
    user: "Sarah J.",
    action: "merged PR",
    target: "#442",
    targetType: "pr",
    extra: "into main",
    time: "10 mins ago",
    badgeColor: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
  {
    id: "2",
    user: "System",
    action: "Status updated to",
    statusTag: "Done",
    target: "PHX-998",
    targetType: "issue",
    time: "45 mins ago",
    badgeColor: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    id: "3",
    user: "DevFlow AI",
    action: "suggested automated subtasks for",
    target: "PHX-1042",
    targetType: "ai",
    codeSnippet: "Added 3 verification checkpoints to OAuth handler",
    time: "2 hours ago",
    badgeColor: "border-purple-200 bg-purple-50 text-purple-700",
  },
  {
    id: "4",
    user: "Alice Chen",
    action: "assigned",
    target: "PHX-1104",
    targetType: "issue",
    extra: "to Bob Martinez",
    time: "3 hours ago",
    badgeColor: "border-blue-200 bg-blue-50 text-blue-700",
  },
];

export default function DashboardOverviewPage() {
  const { openCreateIssue } = useUiStore();
  const [chartTab, setChartTab] = useState<"burndown" | "velocity">("burndown");
  const [showAiModal, setShowAiModal] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState("Sprint 42");
  const [assignments, setAssignments] = useState<AssignmentIssue[]>(INITIAL_ASSIGNMENTS);
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>("PHX-1042");

  const handleToggleSubtask = (issueId: string, subtaskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAssignments((prev) =>
      prev.map((issue) => {
        if (issue.id !== issueId) return issue;
        const updatedSubtasks = issue.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        return {
          ...issue,
          subtasks: updatedSubtasks,
        };
      })
    );
  };

  const handleToggleExpand = (issueId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIssueId((prev) => (prev === issueId ? null : issueId));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* ─── Dashboard Header ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
            <span>Project Phoenix</span>
            <span>&bull;</span>
            <span className="font-semibold text-slate-700">{selectedSprint}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sprint Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedSprint}
              onChange={(e) => setSelectedSprint(e.target.value)}
              className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer outline-none focus:border-indigo-500"
            >
              <option value="Sprint 42">Sprint 42 (Current Active)</option>
              <option value="Sprint 41">Sprint 41 (Previous)</option>
              <option value="Sprint 40">Sprint 40</option>
              <option value="Backlog">Product Backlog</option>
            </select>
          </div>

          <button
            onClick={() => openCreateIssue()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Issue</span>
          </button>
        </div>
      </div>

      {/* ─── Top 4 Metric Cards ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Issues */}
        <div className="card-clean p-5 relative overflow-hidden group">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Issues
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Bug className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            {MOCK_METRICS.activeIssues}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <span className="inline-flex items-center gap-0.5 text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
              <ArrowUp className="w-3 h-3" />
              {MOCK_METRICS.activeIssuesTrend}
            </span>
          </div>
        </div>

        {/* Metric 2: Sprint Velocity */}
        <div className="card-clean p-5 relative overflow-hidden group">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sprint Velocity
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            {MOCK_METRICS.velocity} <span className="text-lg font-semibold text-slate-500">pts</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{MOCK_METRICS.velocityStatus}</span>
          </div>
        </div>

        {/* Metric 3: Open Bugs */}
        <div className="card-clean p-5 relative overflow-hidden group">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Open Bugs
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            {MOCK_METRICS.openBugs}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <span className="inline-flex items-center gap-0.5 text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
              <Minus className="w-3 h-3" />
              {MOCK_METRICS.openBugsStatus}
            </span>
          </div>
        </div>

        {/* Metric 4: AI Suggestions */}
        <div
          onClick={() => setShowAiModal(true)}
          className="p-5 rounded-xl bg-gradient-to-br from-indigo-50/90 via-purple-50/50 to-white border border-indigo-200/80 shadow-2xs hover:shadow-xs cursor-pointer group transition-all"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">
              AI Insights
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200">
              Ready
            </span>
          </div>
          <div className="text-3xl font-extrabold text-indigo-950 tracking-tight mb-2 flex items-center gap-2">
            <span>{MOCK_METRICS.aiSuggestionsCount} Fixes</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-indigo-700 group-hover:text-indigo-900 font-semibold transition-colors">
            <span>Review suggestions</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* ─── Bento Grid Layout (3 Columns) ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1/3): My Assignments with Interactive Subtasks */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
          {/* Panel Header */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900">
                My Assignments
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {assignments.length}
              </span>
            </div>
            <button
              className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors"
              title="Filter"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Assignments List */}
          <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[560px]">
            {assignments.map((issue) => {
              const totalSubtasks = issue.subtasks.length;
              const completedSubtasks = issue.subtasks.filter((st) => st.completed).length;
              const percentage =
                totalSubtasks > 0
                  ? Math.round((completedSubtasks / totalSubtasks) * 100)
                  : 0;
              const isExpanded = expandedIssueId === issue.id;
              const isFullyComplete = percentage === 100;

              return (
                <div
                  key={issue.id}
                  className="p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-indigo-300 hover:shadow-2xs transition-all duration-150 group"
                >
                  {/* Top Key & Priority */}
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-xs font-mono font-bold text-indigo-600 group-hover:underline">
                      {issue.id}
                    </span>
                    <div className="flex items-center">
                      {issue.priority === "critical" && (
                        <span title="Critical Priority" className="flex items-center text-rose-600 font-semibold text-xs">
                          <ChevronsUp className="w-4 h-4" />
                        </span>
                      )}
                      {issue.priority === "high" && (
                        <span title="High Priority" className="flex items-center text-orange-600 font-semibold text-xs">
                          <ChevronUp className="w-4 h-4" />
                        </span>
                      )}
                      {issue.priority === "medium" && (
                        <span title="Medium Priority" className="flex items-center text-amber-500 font-semibold text-xs">
                          <ChevronUp className="w-4 h-4" />
                        </span>
                      )}
                      {issue.priority === "low" && (
                        <span
                          className="w-2 h-2 rounded-full bg-slate-400 inline-block"
                          title="Low Priority"
                        />
                      )}
                    </div>
                  </div>

                  {/* Issue Title */}
                  <p className="text-xs text-slate-800 font-medium leading-snug mb-3 line-clamp-2">
                    {issue.title}
                  </p>

                  {/* Subtask Progress Bar */}
                  <div className="mb-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex justify-between items-center text-[11px] mb-1.5">
                      <button
                        onClick={(e) => handleToggleExpand(issue.id, e)}
                        className="flex items-center gap-1 text-slate-700 hover:text-indigo-600 font-medium transition-colors cursor-pointer"
                      >
                        <ListChecks className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Subtasks</span>
                        <ChevronDown
                          className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${
                            isExpanded ? "rotate-180 text-indigo-600" : ""
                          }`}
                        />
                      </button>

                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-slate-500 text-[10px]">
                          {completedSubtasks}/{totalSubtasks}
                        </span>
                        <span
                          className={`font-semibold text-xs ${
                            isFullyComplete
                              ? "text-emerald-600"
                              : "text-indigo-600"
                          }`}
                        >
                          {percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Track & Fill */}
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percentage}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          isFullyComplete
                            ? "bg-emerald-500"
                            : "bg-indigo-600"
                        }`}
                      />
                    </div>

                    {/* Expandable Subtask Checklist */}
                    {isExpanded && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/80 space-y-1.5 animate-fade-in">
                        {issue.subtasks.map((st) => (
                          <div
                            key={st.id}
                            onClick={(e) => handleToggleSubtask(issue.id, st.id, e)}
                            className="flex items-center gap-2 p-1 rounded hover:bg-slate-100/80 cursor-pointer transition-colors"
                          >
                            <button
                              type="button"
                              className="text-slate-400 shrink-0 cursor-pointer"
                              aria-label={st.completed ? "Mark incomplete" : "Mark complete"}
                            >
                              {st.completed ? (
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600" />
                              )}
                            </button>
                            <span
                              className={`text-[11px] leading-tight select-none ${
                                st.completed
                                  ? "line-through text-slate-400"
                                  : "text-slate-800"
                              }`}
                            >
                              {st.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Status */}
                  <div className="flex justify-between items-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${issue.statusColor}`}
                    >
                      {issue.status}
                    </span>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Reassign"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                      </button>
                      <Link
                        href={`/dashboard/issues/${issue.id}`}
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                        title="Open Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50/70 border-t border-slate-100 text-center">
            <Link
              href="/dashboard/issues"
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
            >
              View all assigned issues &rarr;
            </Link>
          </div>
        </div>

        {/* Right Column (2/3): Sprint Chart & Recent Activity */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Sprint Progress Chart Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Sprint Progress
                </h3>
                <p className="text-[11px] text-slate-500">
                  Story points burndown vs committed target
                </p>
              </div>

              <div className="flex rounded-lg bg-slate-200/80 p-0.5 border border-slate-200">
                <button
                  onClick={() => setChartTab("burndown")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    chartTab === "burndown"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Burndown
                </button>
                <button
                  onClick={() => setChartTab("velocity")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    chartTab === "velocity"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Velocity
                </button>
              </div>
            </div>

            <div className="p-5 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartTab === "burndown" ? (
                  <AreaChart data={BURNDOWN_DATA}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="day"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        color: "#0f172a",
                        fontSize: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorActual)"
                      name="Remaining Points"
                    />
                    <Area
                      type="monotone"
                      dataKey="ideal"
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      fillOpacity={0}
                      fill="transparent"
                      name="Guideline"
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={VELOCITY_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="sprint"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        color: "#0f172a",
                        fontSize: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Bar
                      dataKey="velocity"
                      fill="#4f46e5"
                      radius={[4, 4, 0, 0]}
                      name="Completed Points"
                    />
                    <Bar
                      dataKey="committed"
                      fill="#e2e8f0"
                      radius={[4, 4, 0, 0]}
                      name="Committed Points"
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity Timeline Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-900">
                Recent Activity
              </h3>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                Live Feed
              </span>
            </div>

            <div className="p-5 relative space-y-4">
              {/* Timeline Line */}
              <div className="absolute left-7 top-6 bottom-6 w-[2px] bg-slate-200 pointer-events-none" />

              {RECENT_ACTIVITIES.map((act) => (
                <div key={act.id} className="flex items-start gap-4 relative z-10">
                  <div className="w-5 h-5 rounded-full bg-white border-2 border-indigo-600 mt-0.5 flex-shrink-0 flex items-center justify-center shadow-2xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-800 leading-relaxed">
                      <span className="font-semibold text-slate-900">{act.user}</span>{" "}
                      {act.action}{" "}
                      {act.statusTag && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono font-semibold text-[11px]">
                          {act.statusTag}
                        </span>
                      )}{" "}
                      <Link
                        href={`/dashboard/issues/${act.target}`}
                        className="text-indigo-600 font-mono font-semibold hover:underline cursor-pointer"
                      >
                        {act.target}
                      </Link>
                      {act.extra && <span> {act.extra}</span>}
                    </p>

                    {act.codeSnippet && (
                      <div className="mt-1.5 p-2 rounded-lg bg-slate-50 border border-purple-200/80 flex items-center gap-2 text-[11px] text-purple-900 font-medium">
                        <Bot className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                        <span className="truncate">{act.codeSnippet}</span>
                      </div>
                    )}

                    <p className="text-[10px] text-slate-400 mt-1">
                      {act.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Quick Actions Footer Row ──────────────────── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">
              AI Assistant Ready
            </p>
            <p className="text-[11px] text-slate-500">
              3 subtask suggestions and 1 duplicate issue ready for review.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/board"
            className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
          >
            Open Kanban Board
          </Link>
          <button
            onClick={() => setShowAiModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Review Suggestions</span>
          </button>
        </div>
      </div>

      {/* ─── AI Analysis Modal ──────────────────────────── */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    DevFlow AI Insights
                  </h3>
                  <p className="text-xs text-slate-500">
                    Automated code analysis &amp; sprint recommendations
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm px-2 py-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-mono font-bold text-indigo-600">
                    PHX-1042 Bug Fix Suggestion
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    98% Confidence
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  Missing token expiration check detected in OAuth2 callback handler.
                  Generated patch creates auto-refresh retry loop.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-mono font-bold text-amber-700">
                    Sprint Velocity Prediction
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Estimated 52 pts
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  Team is trending 8% ahead of schedule for Sprint 42. Recommended to
                  pull 1 backlog item into current sprint.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
              >
                Apply Recommendations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
