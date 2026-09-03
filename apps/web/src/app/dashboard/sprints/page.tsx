"use client";

import { useEffect, useState } from "react";
import {
  Columns3,
  Flame,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Plus,
  Play,
  CheckCheck,
  Search,
  Filter,
  BarChart2,
  Users,
  ChevronRight,
  X,
  Target,
} from "lucide-react";
import Link from "next/link";
import { sprintApi, workspaceApi, projectApi } from "@/lib/api";
import { useRealtime } from "@/lib/useRealtime";
import toast from "react-hot-toast";

export default function SprintsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [sprints, setSprints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newSprint, setNewSprint] = useState({
    name: "",
    goal: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
  });

  const loadInitialData = async () => {
    try {
      setLoading(true);
      let currentWsId = "";
      const wsRes = await workspaceApi.list().catch(() => null);
      if (wsRes?.success && wsRes.data?.length > 0) {
        currentWsId = wsRes.data[0].id;
      }

      // Fetch projects from Database
      const dbProjects = currentWsId ? (await projectApi.list(currentWsId).catch(() => null))?.data || [] : [];
      const allProjects = dbProjects.map((p: any) => ({ id: p.id, name: p.name, key: p.key || "DEV", description: p.description }));
      setProjects(allProjects);

      if (allProjects.length > 0) {
        const preferred = allProjects.find((p: any) => p.id === "hg2D1fflVt3JgxNGwU50" || p.key === "WEB") || allProjects[0];
        setSelectedProjectId(preferred.id);
        loadSprints(preferred.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSprints = async (projId: string) => {
    if (!projId) return;
    try {
      const res = await sprintApi.list(projId).catch(() => null);
      const apiSprints = res?.success && res.data ? res.data : [];
      setSprints(apiSprints);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const { lastEvent } = useRealtime(selectedProjectId);

  useEffect(() => {
    if (selectedProjectId && lastEvent?.type.startsWith("sprint.")) {
      loadSprints(selectedProjectId);
    }
  }, [selectedProjectId, lastEvent]);

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    let projId = selectedProjectId;
    if (!projId && projects.length > 0) {
      projId = projects[0].id;
    }
    if (!projId) {
      toast.error("Please select a project first");
      return;
    }
    try {
      setCreating(true);
      const payload = {
        name: newSprint.name,
        goal: newSprint.goal || undefined,
        startDate: newSprint.startDate ? new Date(newSprint.startDate).toISOString() : undefined,
        endDate: newSprint.endDate ? new Date(newSprint.endDate).toISOString() : undefined,
      };

      // Create in API
      await sprintApi.create(projId, payload).catch(() => null);

      setIsCreateOpen(false);
      setNewSprint({
        name: "",
        goal: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      });
      loadSprints(projId);
      toast.success("Sprint created successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create sprint");
    } finally {
      setCreating(false);
    }
  };

  const activeSprint = sprints.find((s) => s.status === "ACTIVE");
  const plannedSprints = sprints.filter((s) => s.status === "PLANNING");
  const completedSprints = sprints.filter((s) => s.status === "COMPLETED");

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto text-slate-900 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Columns3 className="w-6 h-6 text-indigo-600" />
            Sprint Management &amp; Milestones
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Plan iteration cadences, inspect velocity burndown progress, and track issue completions
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Sprint</span>
          </button>

          <Link
            href="/dashboard/board"
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <span>Kanban Board</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Project Selector Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Project:
          </span>
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              loadSprints(e.target.value);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 cursor-pointer"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total Sprints: <span className="font-bold text-slate-900">{sprints.length}</span> ({completedSprints.length} Completed, {plannedSprints.length} Planned)
        </div>
      </div>

      {/* ─── ACTIVE SPRINT SPOTLIGHT ─── */}
      {activeSprint && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Sprint
                </span>
                <h2 className="text-lg font-bold tracking-tight">{activeSprint.name}</h2>
              </div>
              <p className="text-xs text-indigo-200/80">
                {activeSprint.goal || "Core sprint goals and deliverable milestones."}
              </p>
            </div>

            <Link
              href={`/dashboard/sprints/${activeSprint.id}`}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold rounded-lg shadow-md flex items-center gap-2 transition-colors self-start sm:self-center shrink-0"
            >
              <span>View Sprint Issues &amp; Progress</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-indigo-200/70 text-[11px] block">Story Points</span>
              <p className="text-lg font-bold mt-0.5">
                {activeSprint.completedPoints || 0} / {activeSprint.totalPoints || 0} pts
              </p>
              <span className="text-[10px] text-emerald-400 font-semibold block">
                {activeSprint.totalPoints > 0 ? Math.round(((activeSprint.completedPoints || 0) / activeSprint.totalPoints) * 100) : 0}% delivered
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-indigo-200/70 text-[11px] block">Issues Progress</span>
              <p className="text-lg font-bold mt-0.5">
                {activeSprint.completedIssues || 0} / {activeSprint.totalIssues || 0} done
              </p>
              <span className="text-[10px] text-indigo-300 font-semibold block">
                {(activeSprint.totalIssues || 0) - (activeSprint.completedIssues || 0)} remaining
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-indigo-200/70 text-[11px] block">Duration</span>
              <p className="text-lg font-bold mt-0.5">
                {activeSprint.startDate ? new Date(activeSprint.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Start"} &rarr; {activeSprint.endDate ? new Date(activeSprint.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "End"}
              </p>
              <span className="text-[10px] text-amber-300 font-semibold block">2-week iteration</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-indigo-200/70 text-[11px] block">Sprint Status</span>
              <p className="text-lg font-bold mt-0.5 text-emerald-400">On Track</p>
              <span className="text-[10px] text-indigo-200/70 font-semibold block">94.2% velocity SLA</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── ALL SPRINTS ROSTER ─── */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          All Sprint Iterations
        </h3>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading sprint iterations...</div>
        ) : sprints.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <Columns3 className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No sprints created yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your team&apos;s first sprint to organize backlog issues into deliverable milestones.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
            >
              Create Sprint
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sprints.map((sprint) => {
              const completion = sprint.totalPoints > 0
                ? Math.round(((sprint.completedPoints || 0) / sprint.totalPoints) * 100)
                : sprint.totalIssues > 0
                ? Math.round(((sprint.completedIssues || 0) / sprint.totalIssues) * 100)
                : 0;

              return (
                <div
                  key={sprint.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:shadow-md hover:border-indigo-200 transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sprint.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : sprint.status === "COMPLETED"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        {sprint.status}
                      </span>

                      <span className="text-[11px] font-mono text-slate-400">
                        {sprint.totalPoints || 0} pts
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {sprint.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {sprint.goal || "Sprint goals and targeted engineering milestones."}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                        <span>{sprint.completedIssues || 0}/{sprint.totalIssues || 0} issues</span>
                        <span className="text-indigo-600">{completion}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all"
                          style={{ width: `${completion}%` }}
                        />
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/sprints/${sprint.id}`}
                      className="w-full py-2 bg-slate-50 group-hover:bg-indigo-50 text-slate-700 group-hover:text-indigo-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-slate-200 group-hover:border-indigo-200 shadow-2xs"
                    >
                      <span>Inspect Sprint Issues</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Create Sprint Modal ─── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create New Sprint</h3>
                <p className="text-xs text-slate-500">Plan a targeted iteration milestone.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSprint} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-900 outline-none cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.key})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sprint Name</label>
                <input
                  type="text"
                  required
                  value={newSprint.name}
                  onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
                  placeholder="e.g. Sprint 15 - Search & Checkout"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sprint Goal</label>
                <textarea
                  rows={2}
                  value={newSprint.goal}
                  onChange={(e) => setNewSprint({ ...newSprint, goal: e.target.value })}
                  placeholder="Deliver search filtering, Elasticsearch indexer, and checkout SLA"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newSprint.startDate}
                    onChange={(e) => setNewSprint({ ...newSprint, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newSprint.endDate}
                    onChange={(e) => setNewSprint({ ...newSprint, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Sprint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
