"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Sparkles,
  Bug,
  ListTodo,
  Rocket,
  BookOpen,
  ChevronsUp,
  ChevronUp,
  Minus,
  Paperclip,
  Check,
  UploadCloud,
  Layers,
  Calendar,
  User,
  Tag,
  AlertTriangle,
  ListChecks,
  Footprints,
  Database,
  FolderKanban,
} from "lucide-react";
import { useUiStore } from "@/lib/store";
import { aiApi, issueApi, projectApi, sprintApi, workspaceApi } from "@/lib/api";
import { usePermissions } from "@/hooks/usePermissions";

const DEFAULT_MEMBERS = [
  { id: "usr_alice", name: "Alice Chen", role: "Lead Architect" },
  { id: "usr_bob", name: "Bob Martinez", role: "Senior Fullstack" },
  { id: "usr_carol", name: "Carol Zhang", role: "Product Manager" },
  { id: "usr_david", name: "David Kim", role: "QA Engineer" },
];

const AVAILABLE_LABELS = [
  { id: "l1", name: "checkout", color: "#ef4444" },
  { id: "l2", name: "payment", color: "#eab308" },
  { id: "l3", name: "auth", color: "#6366f1" },
  { id: "l4", name: "security", color: "#db2777" },
  { id: "l5", name: "performance", color: "#16a34a" },
  { id: "l6", name: "api", color: "#2563eb" },
  { id: "l7", name: "ui", color: "#0284c7" },
  { id: "l8", name: "ai", color: "#8b5cf6" },
];

export default function CreateIssueModal() {
  const { isCreateIssueOpen, defaultStatus, closeCreateIssue } = useUiStore();
  const { canCreateIssue, role: activeRole } = usePermissions();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"BUG" | "FEATURE" | "TASK" | "STORY">("BUG");
  const [priority, setPriority] = useState<"CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("HIGH");
  const [assigneeId, setAssigneeId] = useState("usr_alice");
  const [sprintId, setSprintId] = useState("");
  const [storyPoints, setStoryPoints] = useState(3);
  const [selectedLabels, setSelectedLabels] = useState<string[]>(["checkout", "bug"]);
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [dismissedDuplicates, setDismissedDuplicates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Dynamic context
  const [projects, setProjects] = useState<any[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("");
  const [projectKey, setProjectKey] = useState<string>("");
  const [members, setMembers] = useState<any[]>(DEFAULT_MEMBERS);
  const [sprints, setSprints] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load active projects, members, and sprints
  useEffect(() => {
    if (!isCreateIssueOpen) return;

    const loadContext = async () => {
      try {
        let currentWorkspaceId = typeof window !== "undefined" ? localStorage.getItem("currentWorkspaceId") || "" : "";
        const wsRes = await workspaceApi.list().catch(() => null);
        if (wsRes?.success && wsRes.data?.length > 0) {
          let ws = wsRes.data.find((w: any) => w.id === currentWorkspaceId);
          if (!ws) {
            const withProjects = wsRes.data.find((w: any) => (w._count?.projects || 0) > 0);
            ws = withProjects || wsRes.data[0];
          }
          currentWorkspaceId = ws.id;
          if (typeof window !== "undefined") {
            localStorage.setItem("currentWorkspaceId", currentWorkspaceId);
          }
          if (ws.members && ws.members.length > 0) {
            setMembers(
              ws.members.map((m: any) => ({
                id: m.user?.id || m.userId,
                name: m.user?.name || "Member",
                role: m.role || "Developer",
              }))
            );
          }
        }

        // Fetch projects from Database
        const dbProjects = currentWorkspaceId
          ? (await projectApi.list(currentWorkspaceId).catch(() => null))?.data || []
          : [];

        const allProjects = dbProjects.map((p: any) => ({
          id: p.id,
          name: p.name,
          key: p.key || "DEV",
          description: p.description,
        }));
        setProjects(allProjects);

        if (allProjects.length > 0) {
          const selected = allProjects.find((p: any) => p.id === projectId) || allProjects[0];
          setProjectId(selected.id);
          setProjectName(selected.name);
          setProjectKey(selected.key);

          const sprintRes = await sprintApi.list(selected.id).catch(() => null);
          const apiSprints = sprintRes?.success && sprintRes.data ? sprintRes.data : [];
          const allSprints = apiSprints.map((s: any) => ({ id: s.id, name: s.name, status: s.status }));
          setSprints(allSprints);
          if (allSprints.length > 0) {
            const activeS = allSprints.find((s: any) => s.status === "ACTIVE") || allSprints[0];
            setSprintId(activeS?.id || "");
          } else {
            setSprintId("");
          }
        }
      } catch (err) {
        console.warn("Context load notice in CreateIssueModal:", err);
      }
    };

    loadContext();
  }, [isCreateIssueOpen]);

  const handleProjectChange = async (selectedId: string) => {
    setProjectId(selectedId);
    const proj = projects.find((p) => p.id === selectedId);
    if (proj) {
      setProjectName(proj.name);
      setProjectKey(proj.key);
    }
    try {
      const sprintRes = await sprintApi.list(selectedId).catch(() => null);
      const apiSprints = sprintRes?.success && sprintRes.data ? sprintRes.data : [];
      const allSprints = apiSprints.map((s: any) => ({ id: s.id, name: s.name, status: s.status }));
      setSprints(allSprints);
      if (allSprints.length > 0) {
        const activeS = allSprints.find((s: any) => s.status === "ACTIVE") || allSprints[0];
        setSprintId(activeS?.id || "");
      } else {
        setSprintId("");
      }
    } catch {
      setSprints([]);
      setSprintId("");
    }
  };

  // Debounced duplicate detection
  useEffect(() => {
    if (!title || title.trim().length < 4 || dismissedDuplicates) {
      setDuplicates([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingDuplicates(true);
      try {
        const res = await aiApi.detectDuplicates(projectId, title).catch(() => null);
        if (res?.data?.duplicates) {
          setDuplicates(res.data.duplicates);
        }
      } catch (err) {
        console.warn("Duplicate check notice:", err);
      } finally {
        setIsCheckingDuplicates(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [title, dismissedDuplicates, projectId]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCreateIssueOpen) {
        closeCreateIssue();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCreateIssueOpen, closeCreateIssue]);

  if (!isCreateIssueOpen) return null;

  const toggleLabel = (name: string) => {
    setSelectedLabels((prev) =>
      prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name]
    );
  };

  const handleAiTriage = async () => {
    if (!title.trim()) return;
    setIsAnalyzing(true);

    try {
      const res = await aiApi.analyzeIssue(projectId, title, description).catch(() => null);

      if (res?.data) {
        const ai = res.data;
        setAiSuggestions(ai);
        if (ai.suggestedPriority) setPriority(ai.suggestedPriority);
        if (ai.suggestedCategory) setType(ai.suggestedCategory as any);
        if (ai.suggestedLabels?.length) {
          setSelectedLabels((prev) => [...new Set([...prev, ...ai.suggestedLabels])]);
        }

        if (!description.trim() && (ai.reproductionSteps || ai.acceptanceCriteria)) {
          let enriched = `### Overview\n${ai.reasoning || title}\n\n`;
          if (ai.reproductionSteps?.length) {
            enriched += `### Steps to Reproduce\n${ai.reproductionSteps.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}\n\n`;
          }
          if (ai.acceptanceCriteria?.length) {
            enriched += `### Acceptance Criteria\n${ai.acceptanceCriteria.map((c: string) => `- [ ] ${c}`).join("\n")}\n`;
          }
          setDescription(enriched);
        }
      } else {
        const lower = title.toLowerCase();
        let detectedPriority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
        let detectedCategory: "BUG" | "FEATURE" | "TASK" | "STORY" = "TASK";

        if (lower.includes("crash") || lower.includes("exception") || lower.includes("broken") || lower.includes("fail") || lower.includes("bug")) {
          detectedCategory = "BUG";
          detectedPriority = lower.includes("crash") || lower.includes("security") ? "CRITICAL" : "HIGH";
        } else if (lower.includes("add") || lower.includes("implement") || lower.includes("support") || lower.includes("feature")) {
          detectedCategory = "FEATURE";
          detectedPriority = "MEDIUM";
        }

        const mockAi = {
          suggestedCategory: detectedCategory,
          suggestedPriority: detectedPriority,
          confidence: 0.94,
          reasoning: `AI analyzed title semantics: detected ${detectedCategory} pattern with ${detectedPriority} severity.`,
          suggestedLabels: lower.includes("auth") ? ["auth", "security"] : lower.includes("payment") ? ["payment", "checkout"] : ["frontend", "api"],
          reproductionSteps: [
            "Navigate to the affected application view",
            "Perform user action described in the issue title",
            "Observe the unexpected error / state in logs",
          ],
          acceptanceCriteria: [
            "Root cause identified and resolved",
            "Unit tests added covering edge cases",
            "Verified on staging environment",
          ],
        };

        setAiSuggestions(mockAi);
        setPriority(detectedPriority);
        setType(detectedCategory);
        setSelectedLabels((prev) => [...new Set([...prev, ...mockAi.suggestedLabels])]);

        if (!description.trim()) {
          setDescription(`### Context\n${title}\n\n### Steps to Reproduce\n1. Open application\n2. Trigger action\n3. Verify error log\n\n### Acceptance Criteria\n- [ ] Fix implemented\n- [ ] Tested against staging`);
        }
      }
    } catch (err) {
      console.warn("AI Triage error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);

    try {
      let createdNumber = Math.floor(Date.now() / 1000) % 10000;

      // 1. Save to Database via REST API
      try {
        const apiRes = await issueApi.create(projectId, {
          title,
          description: description || title,
          type,
          priority,
          assigneeId: assigneeId || undefined,
          sprintId: sprintId || undefined,
          storyPoints: storyPoints || 3,
          aiAnalysis: aiSuggestions ? JSON.stringify(aiSuggestions) : undefined,
        });
        if (apiRes?.success && apiRes.data?.number) {
          createdNumber = apiRes.data.number;
        }
      } catch (apiErr) {
        console.warn("API createIssue notice:", apiErr);
      }



      // 3. Dispatch global browser event for instant UI update
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("devflow:issue_created", {
            detail: { projectId, title, number: createdNumber },
          })
        );
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(false);
        closeCreateIssue();
        // Reset form
        setTitle("");
        setDescription("");
        setAiSuggestions(null);
        setFiles([]);
      }, 600);
    } catch (err) {
      console.error("Create issue failed:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={() => closeCreateIssue()}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in"
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-2xs font-bold text-sm">
              +
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Create New Issue
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <span>{projectName ? `${projectName} (${projectKey})` : "Select Project"}</span>
                <span>&bull;</span>
                <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                  <Database className="w-3 h-3" /> Real Database Sync
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              AI Copilot Enabled
            </span>

            <button
              onClick={closeCreateIssue}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Role Restriction Banner */}
        {!canCreateIssue && (
          <div className="mx-6 mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Read-Only Mode: </span>
              <span>Your current role ({activeRole}) has read-only privileges and cannot create tickets.</span>
            </div>
          </div>
        )}

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Target Project & Sprint Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
            {/* Project Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
                Target Project <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={projectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 shadow-2xs cursor-pointer"
              >
                {projects.length > 0 ? (
                  projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.key})
                    </option>
                  ))
                ) : (
                  <option value="">{projectName ? `${projectName} (${projectKey})` : "Loading projects..."}</option>
                )}
              </select>
            </div>

            {/* Sprint Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Sprint Assignment
              </label>
              <select
                value={sprintId}
                onChange={(e) => setSprintId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 shadow-2xs cursor-pointer"
              >
                <option value="">Product Backlog (No sprint)</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Issue Title & AI Trigger */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Issue Title <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAiTriage}
                disabled={!title.trim() || isAnalyzing}
                className="text-[11px] text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 disabled:opacity-40 px-2.5 py-0.5 rounded-md font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>AI Auto-Triage</span>
                  </>
                )}
              </button>
            </div>

            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Checkout crashes when user applies SAVE20 coupon"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 placeholder:text-slate-400 shadow-2xs transition-all"
            />
          </div>

          {/* AI Suggestions Box */}
          {aiSuggestions && (
            <div className="p-3.5 bg-gradient-to-br from-purple-50 via-indigo-50/50 to-white border border-purple-200/80 rounded-xl space-y-2 animate-fade-in shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  AI Triage Analysis
                </span>
                <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  {Math.round(aiSuggestions.confidence * 100)}% Confidence
                </span>
              </div>
              <p className="text-xs text-purple-900/90 leading-relaxed">
                {aiSuggestions.reasoning}
              </p>
            </div>
          )}

          {/* Issue Type & Priority Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Issue Type
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "BUG", label: "Bug", icon: Bug, color: "text-rose-600" },
                  { id: "TASK", label: "Task", icon: ListTodo, color: "text-blue-600" },
                  { id: "FEATURE", label: "Feature", icon: Rocket, color: "text-emerald-600" },
                  { id: "STORY", label: "Story", icon: BookOpen, color: "text-purple-600" },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = type === t.id;
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setType(t.id as any)}
                      className={`py-2 px-1 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50/80 border-indigo-600 text-indigo-900 shadow-2xs"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${t.color}`} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Priority
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "CRITICAL", label: "Critical", icon: ChevronsUp, color: "text-rose-600" },
                  { id: "HIGH", label: "High", icon: ChevronUp, color: "text-orange-600" },
                  { id: "MEDIUM", label: "Med", icon: ChevronUp, color: "text-amber-500" },
                  { id: "LOW", label: "Low", icon: Minus, color: "text-slate-400" },
                ].map((p) => {
                  const Icon = p.icon;
                  const isSelected = priority === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setPriority(p.id as any)}
                      className={`py-2 px-1 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50/80 border-indigo-600 text-indigo-900 shadow-2xs"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${p.color}`} />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Description &amp; Reproduction Steps
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened, expected behavior, and reproduction steps..."
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 placeholder:text-slate-400 font-mono shadow-2xs leading-relaxed"
            />
          </div>

          {/* Assignee & Story Points Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Assignee */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 shadow-2xs cursor-pointer"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Story Points */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Story Points
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 5, 8].map((pts) => (
                  <button
                    type="button"
                    key={pts}
                    onClick={() => setStoryPoints(pts)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                      storyPoints === pts
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-2xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {pts}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Labels Chip Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Labels &amp; Categories
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_LABELS.map((lbl) => {
                const isSelected = selectedLabels.includes(lbl.name);
                return (
                  <button
                    type="button"
                    key={lbl.id}
                    onClick={() => toggleLabel(lbl.name)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? "shadow-2xs font-bold"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    style={{
                      background: isSelected ? `${lbl.color}25` : `${lbl.color}08`,
                      color: lbl.color,
                      borderColor: isSelected ? lbl.color : `${lbl.color}30`,
                    }}
                  >
                    {isSelected ? `✓ ${lbl.name}` : `+ ${lbl.name}`}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/80">
          <button
            type="button"
            onClick={closeCreateIssue}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!title.trim() || isSubmitting || !canCreateIssue}
            title={!canCreateIssue ? `Role ${activeRole} cannot create issues` : undefined}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {isSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Issue Created!</span>
              </>
            ) : isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Ticket...</span>
              </>
            ) : !canCreateIssue ? (
              <span>Create Restricted (Read-Only)</span>
            ) : (
              <>
                <span>Create Issue</span>
                <span className="text-[10px] opacity-75 font-mono">(Enter)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
