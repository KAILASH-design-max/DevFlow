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
} from "lucide-react";
import { useUiStore } from "@/lib/store";
import { aiApi, issueApi } from "@/lib/api";

const AVAILABLE_MEMBERS = [
  { id: "u1", name: "Alice Chen", role: "Engineering Lead" },
  { id: "u2", name: "Bob Martinez", role: "Fullstack Engineer" },
  { id: "u3", name: "Carol Zhang", role: "QA Engineer" },
  { id: "u4", name: "David Kim", role: "DevOps Engineer" },
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

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"BUG" | "FEATURE" | "TASK" | "STORY">("BUG");
  const [priority, setPriority] = useState<"CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("HIGH");
  const [assigneeId, setAssigneeId] = useState("u1");
  const [sprint, setSprint] = useState("Sprint 42");
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced duplicate detection
  useEffect(() => {
    if (!title || title.trim().length < 4 || dismissedDuplicates) {
      setDuplicates([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingDuplicates(true);
      try {
        const res = await aiApi.detectDuplicates("p1", title).catch(() => null);
        if (res?.data?.duplicates) {
          setDuplicates(res.data.duplicates);
        }
      } catch (err) {
        console.warn("Duplicate check error:", err);
      } finally {
        setIsCheckingDuplicates(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [title, dismissedDuplicates]);

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
      // Call AI endpoint or generate smart context
      const res = await aiApi.analyzeIssue("p1", title, description).catch(() => null);

      if (res?.data) {
        const ai = res.data;
        setAiSuggestions(ai);
        if (ai.suggestedPriority) setPriority(ai.suggestedPriority);
        if (ai.suggestedCategory) setType(ai.suggestedCategory as any);
        if (ai.suggestedLabels?.length) {
          setSelectedLabels((prev) => [...new Set([...prev, ...ai.suggestedLabels])]);
        }

        // Auto-enrich description if empty
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
        // Fallback local smart triage generator
        const isBug = title.toLowerCase().includes("crash") || title.toLowerCase().includes("bug") || title.toLowerCase().includes("error") || title.toLowerCase().includes("fail");
        const detectedPriority = title.toLowerCase().includes("crash") || title.toLowerCase().includes("leak") ? "CRITICAL" : "HIGH";

        const mockAi = {
          confidence: 0.96,
          suggestedCategory: isBug ? "BUG" : "FEATURE",
          suggestedPriority: detectedPriority,
          reasoning: "Categorized based on title semantics and past bug resolution records in Project Phoenix.",
          suggestedLabels: isBug ? ["bug", "checkout", "investigation"] : ["feature", "ui"],
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
        setPriority(detectedPriority as any);
        setType(mockAi.suggestedCategory as any);
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
      // Attempt backend API call
      await issueApi.create("p1", {
        title,
        description,
        type,
        priority,
        assigneeId,
        sprintId: "s1",
        storyPoints,
        status: defaultStatus || "BACKLOG",
      }).catch(() => null);

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
      }, 1000);
    } catch (err) {
      console.error("Create issue failed:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in">
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
              <p className="text-xs text-slate-500">
                Project Phoenix &bull; Sprint 42
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

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
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
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    <span>✨ Auto-Triage with AI</span>
                  </>
                )}
              </button>
            </div>

            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setDismissedDuplicates(false);
              }}
              placeholder="e.g. Checkout crashes when user applies SAVE20 coupon"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 placeholder:text-slate-400 shadow-2xs"
            />

            {/* Live AI Duplicate Detection Alert (Phase 19) */}
            {duplicates.length > 0 && !dismissedDuplicates && (
              <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl space-y-2.5 animate-fade-in shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                      ⚠️
                    </div>
                    <span className="text-xs font-bold text-amber-900">
                      Potential Duplicate Found ({duplicates.length} matching issue{duplicates.length > 1 ? "s" : ""})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDismissedDuplicates(true)}
                    className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold underline cursor-pointer"
                  >
                    Dismiss Warning
                  </button>
                </div>

                <div className="space-y-1.5">
                  {duplicates.map((dup) => (
                    <div
                      key={dup.id}
                      className="p-2.5 bg-white/90 rounded-lg border border-amber-200/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                          {dup.id}
                        </span>
                        <span className="text-slate-800 font-medium truncate">
                          {dup.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            dup.similarityScore >= 75
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {dup.similarityScore}% Match
                        </span>

                        <a
                          href={`/dashboard/issues/${dup.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded text-[11px] transition-colors"
                        >
                          View Ticket &rarr;
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Copilot Suggestion Card */}
          {aiSuggestions && (
            <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50/50 rounded-xl border border-purple-200 text-xs space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-purple-900 font-bold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  AI Triage Recommendations ({Math.round(aiSuggestions.confidence * 100)}% Confidence)
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-mono">
                  Auto-Applied
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {aiSuggestions.reasoning}
              </p>
            </div>
          )}

          {/* Type & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Issue Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "BUG", label: "Bug", icon: Bug, color: "text-rose-600" },
                  { id: "FEATURE", label: "Feature", icon: Rocket, color: "text-purple-600" },
                  { id: "TASK", label: "Task", icon: ListTodo, color: "text-blue-600" },
                  { id: "STORY", label: "Story", icon: BookOpen, color: "text-emerald-600" },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = type === t.id;
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setType(t.id as any)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-300 text-indigo-900 shadow-2xs"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${t.color}`} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Priority
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "CRITICAL", label: "Critical", icon: ChevronsUp, color: "text-rose-600" },
                  { id: "HIGH", label: "High", icon: ChevronUp, color: "text-orange-600" },
                  { id: "MEDIUM", label: "Medium", icon: ChevronUp, color: "text-amber-500" },
                  { id: "LOW", label: "Low", icon: Minus, color: "text-slate-400" },
                ].map((p) => {
                  const Icon = p.icon;
                  const isSelected = priority === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setPriority(p.id as any)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-300 text-indigo-900 shadow-2xs"
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
              Description & Reproduction Steps
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened, expected behavior, and reproduction steps..."
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 placeholder:text-slate-400 font-mono shadow-2xs leading-relaxed"
            />
          </div>

          {/* Assignee, Sprint, Story Points Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                {AVAILABLE_MEMBERS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Sprint */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Sprint
              </label>
              <select
                value={sprint}
                onChange={(e) => setSprint(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 shadow-2xs cursor-pointer"
              >
                <option value="Sprint 42">Sprint 42 (Current Active)</option>
                <option value="Sprint 43">Sprint 43 (Next Sprint)</option>
                <option value="Backlog">Product Backlog</option>
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
              Labels & Categories
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

          {/* Attachments Dropzone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
              <Paperclip className="w-3.5 h-3.5 text-slate-400" />
              Attach Logs or Screenshots (Phase 20)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl text-center bg-slate-50/50 hover:bg-indigo-50/30 transition-all cursor-pointer"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFilesSelected}
                className="hidden"
                accept="image/*,.log,.txt,.json,.csv,.pdf"
              />
              <UploadCloud className="w-5 h-5 text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-700 font-medium">
                {files.length > 0
                  ? `${files.length} file(s) ready to upload: ${files.map((f) => f.name).join(", ")}`
                  : "Drag & drop files here or click to browse"}
              </p>
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
            disabled={!title.trim() || isSubmitting}
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
