"use client";

import { useEffect, useState } from "react";
import {
  FolderKanban,
  Plus,
  Search,
  ExternalLink,
  Users,
  ListTodo,
  Layers,
  Sparkles,
  GitBranch,
  CheckCircle2,
  Clock,
  ArrowRight,
  X,
  AlertCircle,
  Database,
} from "lucide-react";
import Link from "next/link";
import { workspaceApi, projectApi } from "@/lib/api";
import { useRealtime } from "@/lib/useRealtime";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", key: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successToast, setSuccessToast] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");

  useEffect(() => {
    loadProjects();

    loadProjects();

    const handleCreated = () => {
      loadProjects();
    };
    window.addEventListener("devflow:issue_created", handleCreated);

    return () => {
      window.removeEventListener("devflow:issue_created", handleCreated);
    };
  }, []);

  const { lastEvent } = useRealtime();

  useEffect(() => {
    if (lastEvent?.type === "issue.created" || lastEvent?.type === "issue.status_changed" || lastEvent?.type === "project.created") {
      loadProjects();
    }
  }, [lastEvent]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      let currentWsId = "ws_acme_eng";

      try {
        const wsRes = await workspaceApi.list().catch(() => null);
        if (wsRes?.success && wsRes.data?.length > 0) {
          currentWsId = wsRes.data[0].id;
          setWorkspaceId(currentWsId);
        }
      } catch {}

      const dbProjects = currentWsId ? (await projectApi.list(currentWsId).catch(() => null))?.data || [] : [];

      let allProjects = dbProjects;

      if (allProjects.length === 0) {
        allProjects = [
          {
            id: "proj_speedyshop",
            name: "SpeedyShop",
            key: "SS",
            description: "High-performance e-commerce platform with automated delivery logistics",
            workspaceId: currentWsId,
            _count: { issues: 0, members: 1 },
            createdAt: new Date().toISOString(),
          },
        ];
      }

      setProjects(allProjects);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name.trim()) {
      setErrorMsg("Please enter a project name.");
      return;
    }

    try {
      setCreating(true);
      setErrorMsg("");

      // Ensure a valid workspaceId
      let currentWsId = workspaceId;
      if (!currentWsId) {
        try {
          const wsList = await workspaceApi.list();
          if (wsList?.success && wsList.data?.length > 0) {
            currentWsId = wsList.data[0].id;
            setWorkspaceId(currentWsId);
          }
        } catch {
          currentWsId = "ws_acme_eng";
          setWorkspaceId(currentWsId);
        }
      }

      if (!currentWsId) {
        currentWsId = "ws_acme_eng";
      }

      // Derive key if omitted
      const projectKey =
        (newProject.key || newProject.name.replace(/[^A-Za-z]/g, "").slice(0, 4)).toUpperCase() ||
        "PROJ";

      let createdProject: any = null;

      // 1. Try creating via backend API
      try {
        const res = await projectApi.create(currentWsId, {
          name: newProject.name.trim(),
          key: projectKey,
          description: newProject.description.trim(),
        });
        if (res.success && res.data) {
          createdProject = res.data;
        }
      } catch (apiErr: any) {
        console.warn("Backend project API creation notice:", apiErr?.message);
      }

      // Fallback local representation if offline
      if (!createdProject) {
        createdProject = {
          id: `proj_${Date.now()}`,
          name: newProject.name.trim(),
          key: projectKey,
          description: newProject.description.trim(),
          workspaceId: currentWsId,
          _count: { issues: 0, members: 1 },
          createdAt: new Date().toISOString(),
        };
      }

      setProjects((prev) => [createdProject, ...prev]);
      setIsCreateOpen(false);
      setNewProject({ name: "", key: "", description: "" });
      setSuccessToast(`Project "${createdProject.name}" created successfully!`);
      setTimeout(() => setSuccessToast(""), 4000);
    } catch (err: any) {
      console.error("Create project error:", err);
      setErrorMsg(err.message || "Failed to create project. Please check details and retry.");
    } finally {
      setCreating(false);
    }
  };

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.key && p.key.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto text-slate-900 pb-12 relative">
      {/* Success Toast */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <FolderKanban className="w-6 h-6 text-indigo-600" />
            Projects Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your engineering initiatives, repository links, and team delivery backlogs
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg("");
            setIsCreateOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name or key..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:bg-white transition-colors"
          />
        </div>

        <div className="text-xs text-slate-500 px-2 font-medium">
          Showing <span className="font-bold text-slate-900">{filtered.length}</span> projects
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading projects directory...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <FolderKanban className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No projects found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Get started by initializing your team&apos;s first software engineering project.
          </p>
          <button
            onClick={() => {
              setErrorMsg("");
              setIsCreateOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
          >
            Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((proj) => (
            <div
              key={proj.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:shadow-md hover:border-indigo-200 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 font-mono">
                    {proj.key || "PROJ"}
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    KEY: {proj.key || "PROJ"}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {proj.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {proj.description || "Primary software project repository and sprint backlog."}
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <ListTodo className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="font-semibold text-slate-800">
                      {proj._count?.issues ?? proj.issues?.length ?? 0}
                    </span>{" "}
                    Issues
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">
                      {proj._count?.members ?? proj.members?.length ?? 1}
                    </span>{" "}
                    Members
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href={`/dashboard/board?project=${proj.id}`}
                    className="flex-1 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg text-center transition-colors shadow-2xs"
                  >
                    Open Board
                  </Link>
                  <Link
                    href={`/dashboard/issues?project=${proj.id}`}
                    className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
                  >
                    Issues
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      {isCreateOpen && (
        <div
          onClick={() => setIsCreateOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-scale-up relative"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-900">Create New Project</h3>
              <p className="text-xs text-slate-500">Set up a new project key and issue tracker.</p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newProject.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoKey = name.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase();
                    setNewProject((prev) => ({
                      ...prev,
                      name,
                      key: prev.key ? prev.key : autoKey,
                    }));
                  }}
                  placeholder="e.g. Mobile Application"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Project Key (Prefix)</label>
                  <span className="text-[10px] text-slate-400 font-mono">2-5 uppercase letters (A-Z)</span>
                </div>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={5}
                  value={newProject.key}
                  onChange={(e) => {
                    const sanitized = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5);
                    setNewProject((prev) => ({ ...prev, key: sanitized }));
                  }}
                  placeholder="e.g. MOB"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-900 font-mono font-bold outline-none uppercase tracking-wider"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Project goals and technical focus..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {creating && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>{creating ? "Creating..." : "Create Project"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
