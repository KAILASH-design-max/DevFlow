"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Columns3,
  Flame,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Plus,
  Play,
  CheckCheck,
  Search,
  Filter,
  BarChart2,
  Users,
  AlertCircle,
  Check,
  Edit2,
  Layers,
  ChevronDown,
  Target,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { sprintApi, issueApi } from "@/lib/api";

export default function SprintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sprintId = params.id as string;

  const [sprint, setSprint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Status updating
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (sprintId) {
      loadSprintDetails();
    }
  }, [sprintId]);

  const loadSprintDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await sprintApi.get(sprintId);
      if (res.success && res.data) {
        setSprint(res.data);
      } else {
        throw new Error(res.error || "Failed to load sprint details");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load sprint");
    } finally {
      setLoading(false);
    }
  };

  const handleSprintStatusChange = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      setError("");
      setSuccess("");
      const res = await sprintApi.update(sprintId, { status: newStatus });
      if (res.success) {
        setSprint((prev: any) => ({ ...prev, status: newStatus }));
        setSuccess(`Sprint status transitioned to ${newStatus}!`);
      } else {
        throw new Error(res.error || "Failed to update sprint status");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update sprint status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleIssueStatusChange = async (issueId: string, newStatus: string) => {
    try {
      const res = await issueApi.update(issueId, { status: newStatus });
      if (res.success) {
        setSprint((prev: any) => {
          const updatedIssues = prev.issues.map((i: any) =>
            i.id === issueId ? { ...i, status: newStatus } : i
          );
          const completedIssues = updatedIssues.filter((i: any) => i.status === "DONE").length;
          const completedPoints = updatedIssues
            .filter((i: any) => i.status === "DONE")
            .reduce((sum: number, i: any) => sum + (i.storyPoints || 0), 0);
          return {
            ...prev,
            issues: updatedIssues,
            completedIssues,
            completedPoints,
            remainingPoints: prev.totalPoints - completedPoints,
            completionPercentage: prev.totalPoints > 0 ? Math.round((completedPoints / prev.totalPoints) * 100) : 0,
          };
        });
        setSuccess("Issue status updated!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update issue");
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 max-w-7xl mx-auto">
        Loading sprint details and issues progression...
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs max-w-xl mx-auto space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">Sprint Not Found</h3>
        <p className="text-xs text-slate-500">The requested sprint milestone could not be located.</p>
        <Link
          href="/dashboard/sprints"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sprints</span>
        </Link>
      </div>
    );
  }

  const filteredIssues = (sprint.issues || []).filter((issue: any) => {
    const q = search.toLowerCase();
    const matchSearch =
      issue.title.toLowerCase().includes(q) ||
      (issue.key && issue.key.toLowerCase().includes(q)) ||
      (issue.assignee?.name && issue.assignee.name.toLowerCase().includes(q));

    const matchStatus = statusFilter === "ALL" || issue.status === statusFilter;
    const matchPriority = priorityFilter === "ALL" || issue.priority === priorityFilter;

    return matchSearch && matchStatus && matchPriority;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto text-slate-900 pb-16">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/sprints"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sprints Directory</span>
        </Link>

        <Link
          href={`/dashboard/board?sprint=${sprint.id}`}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Columns3 className="w-3.5 h-3.5" />
          <span>Open in Kanban Board</span>
        </Link>
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

      {/* ─── SPRINT HERO HEADER ─── */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                sprint.status === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : sprint.status === "COMPLETED"
                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                  : "bg-slate-100 text-slate-700 border border-slate-200"
              }`}>
                {sprint.status}
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{sprint.name}</h1>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{sprint.goal || "Core milestone deliverable goals and sprint commitments."}</span>
            </p>
          </div>

          {/* Status Switcher & Date Duration */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5">
              {["PLANNING", "ACTIVE", "COMPLETED"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleSprintStatusChange(st)}
                  disabled={updatingStatus || sprint.status === st}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    sprint.status === st
                      ? "bg-white text-indigo-700 shadow-2xs border border-slate-200"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                {sprint.startDate ? new Date(sprint.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Start"} &rarr; {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "End"}
              </span>
            </div>
          </div>
        </div>

        {/* ─── 4 KEY PERFORMANCE INDICATORS ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              <span>Story Points</span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xl font-black text-slate-900">
              {sprint.completedPoints || 0} / {sprint.totalPoints || 0}
            </p>
            <span className="text-[10px] text-emerald-600 font-bold block">
              {sprint.remainingPoints || 0} points remaining
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              <span>Completion Rate</span>
              <CheckCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-xl font-black text-indigo-600">
              {sprint.completionPercentage || 0}%
            </p>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{ width: `${sprint.completionPercentage || 0}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              <span>Issues Delivered</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl font-black text-slate-900">
              {sprint.completedIssues || 0} / {sprint.totalIssues || 0}
            </p>
            <span className="text-[10px] text-slate-500 font-medium block">
              {(sprint.totalIssues || 0) - (sprint.completedIssues || 0)} issues in flight
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              <span>In Progress / Review</span>
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-xl font-black text-slate-900">
              {sprint.inProgressIssues || 0}
            </p>
            <span className="text-[10px] text-indigo-600 font-medium block">
              Active developer work
            </span>
          </div>
        </div>
      </div>

      {/* ─── VELOCITY BURNDOWN & CAPACITY GRIDS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Burndown Velocity Progress Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Sprint Burndown Velocity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ideal remaining trajectory versus actual delivery over the 14-day cycle
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-0.5 bg-slate-300 rounded" /> Ideal Guide
              </span>
              <span className="flex items-center gap-1.5 text-indigo-600">
                <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full" /> Actual Points
              </span>
            </div>
          </div>

          {/* Visual CSS-based Burndown Bar Tracker */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5 items-end h-36 pt-4 px-2">
              {(sprint.burndown || []).slice(0, 14).map((b: any, idx: number) => {
                const total = Math.max(1, sprint.totalPoints || 40);
                const idealHeight = Math.max(8, Math.round((b.ideal / total) * 100));
                const actualHeight = b.actual !== null ? Math.max(8, Math.round((b.actual / total) * 100)) : null;

                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-0.5 h-28">
                      {/* Ideal Guide Column */}
                      <div
                        className="w-1.5 bg-slate-200 rounded-t transition-all"
                        style={{ height: `${idealHeight}%` }}
                        title={`Day ${idx}: Ideal ${b.ideal} pts`}
                      />
                      {/* Actual Remaining Column */}
                      {actualHeight !== null && (
                        <div
                          className="w-2.5 bg-indigo-600 rounded-t shadow-2xs transition-all group-hover:bg-indigo-700"
                          style={{ height: `${actualHeight}%` }}
                          title={`Day ${idx}: Actual ${b.actual} pts remaining`}
                        />
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">{`D${idx}`}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Team Capacity & Allocation Card */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Team Member Allocation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Story points &amp; task volume per engineer
              </p>
            </div>

            <div className="space-y-3 divide-y divide-slate-100">
              {(sprint.assigneeCapacity || []).map((cap: any, idx: number) => {
                const perc = cap.totalPoints > 0 ? Math.round((cap.completedPoints / cap.totalPoints) * 100) : cap.totalIssues > 0 ? Math.round((cap.completedIssues / cap.totalIssues) * 100) : 0;
                return (
                  <div key={idx} className="pt-3 first:pt-0 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{cap.user?.name || "Unassigned"}</span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {cap.completedPoints}/{cap.totalPoints} pts ({cap.totalIssues} tasks)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{ width: `${perc}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            href={`/dashboard/board?sprint=${sprint.id}`}
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg text-center border border-slate-200 transition-colors block mt-4"
          >
            Manage Capacity in Kanban
          </Link>
        </div>
      </div>

      {/* ─── SPRINT ISSUES ROSTER & PROGRESS ─── */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Sprint Backlog &amp; Issues ({filteredIssues.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live progression of tasks committed to this iteration
            </p>
          </div>

          <Link
            href="/dashboard/issues"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Issue</span>
          </Link>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sprint issues..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="BACKLOG">Backlog</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Issues Table */}
        {filteredIssues.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No issues match the selected search and filter criteria.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Issue Key &amp; Title</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Points</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredIssues.map((issue: any) => (
                  <tr key={issue.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-600 text-[11px]">
                            {issue.key || `ISSUE-${issue.id.slice(-4)}`}
                          </span>
                          <span className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors">
                            {issue.title}
                          </span>
                        </div>
                        {issue.labels && issue.labels.length > 0 && (
                          <div className="flex gap-1 pt-0.5">
                            {issue.labels.map((lbl: any) => (
                              <span key={lbl.id || lbl.name} className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                                {lbl.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
                          {issue.assignee?.name ? issue.assignee.name[0].toUpperCase() : "U"}
                        </div>
                        <span className="text-slate-700 font-medium">{issue.assignee?.name || "Unassigned"}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        issue.priority === "URGENT"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : issue.priority === "HIGH"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : issue.priority === "MEDIUM"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                        {issue.priority}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {issue.storyPoints ? `${issue.storyPoints} pts` : "—"}
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={issue.status}
                        onChange={(e) => handleIssueStatusChange(issue.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border outline-none cursor-pointer ${
                          issue.status === "DONE"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : issue.status === "IN_PROGRESS"
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                            : issue.status === "IN_REVIEW"
                            ? "bg-purple-50 border-purple-200 text-purple-700"
                            : "bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        <option value="BACKLOG">Backlog</option>
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="DONE">Done</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
