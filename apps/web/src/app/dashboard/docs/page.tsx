"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Terminal,
  Code2,
  Sparkles,
  Search,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  GitBranch,
  ShieldCheck,
  Rocket,
  Layers,
  ChevronRight,
  Send,
  MessageSquare,
  Bookmark,
  Share2,
  FileCode,
  Sliders,
  Cpu,
  Clock,
  Tag,
} from "lucide-react";

interface CodeSnippet {
  language: string;
  code: string;
}

interface DocArticle {
  id: string;
  title: string;
  category: "Getting Started" | "Architecture & AI" | "CI/CD & DevOps" | "Agile & Workflows" | "API & CLI";
  tags: string[];
  readTime: string;
  summary: string;
  sections: {
    id: string;
    heading: string;
    content: string;
    snippets?: Record<string, string>;
    steps?: { step: string; cmd?: string; detail: string }[];
  }[];
}

const DOC_ARTICLES: DocArticle[] = [
  {
    id: "cli-quickstart",
    title: "DevFlow CLI Quickstart & Setup",
    category: "Getting Started",
    tags: ["#cli", "#git", "#developer-tools", "#quickstart"],
    readTime: "3 min read",
    summary: "Install the official DevFlow CLI, authenticate with your workspace, and link your local Git branches directly to Jira-compatible issue IDs.",
    sections: [
      {
        id: "installing-cli",
        heading: "1. Installing the Global CLI",
        content: "The DevFlow CLI brings real-time AI issue analysis, sprint status, and branch orchestration directly into your terminal. Install via npm, yarn, or brew:",
        steps: [
          {
            step: "Install global package",
            cmd: "npm i -g @devflow/cli",
            detail: "Installs the global `devflow` binary on your system path."
          },
          {
            step: "Authenticate CLI with your API Token",
            cmd: "devflow login --token df_live_8a39f9e2b10",
            detail: "Generates an encrypted session token in ~/.devflow/config.json."
          },
          {
            step: "Verify workspace connection",
            cmd: "devflow workspace current",
            detail: "Outputs your active engineering organization and role permissions."
          }
        ],
      },
      {
        id: "git-branch-sync",
        heading: "2. Git Branch Linking & Automated Checkout",
        content: "Never manually create messy branch names again. Use `devflow checkout` to automatically create a clean, standardized branch matching the issue key:",
        steps: [
          {
            step: "Checkout & Link Issue Branch",
            cmd: "devflow checkout PHX-1042",
            detail: "Creates and checks out `feature/PHX-1042-oauth2-flow` with remote tracking."
          },
          {
            step: "Run Local Test Suite & Linting",
            cmd: "devflow test --coverage",
            detail: "Runs automated unit tests and posts coverage metrics to the issue ticket."
          },
          {
            step: "Submit Pull Request with AI Summary",
            cmd: "devflow pr create --ai-summary",
            detail: "Drafts a GitHub PR with auto-generated test plan and acceptance criteria."
          }
        ]
      }
    ]
  },
  {
    id: "api-playground",
    title: "Interactive REST API Reference & SDKs",
    category: "API & CLI",
    tags: ["#api", "#rest", "#webhooks", "#sdk", "#tokens"],
    readTime: "5 min read",
    summary: "Explore DevFlow REST endpoints for managing issues, triggering AI triage, and fetching real-time sprint metrics in cURL, TypeScript, Python, and Go.",
    sections: [
      {
        id: "create-issue-api",
        heading: "POST /api/issues — Create Issue with AI Scoping",
        content: "Creates a new issue in the specified project. When `autoAiTriage: true` is passed, Gemini automatically parses the description, predicts priority, and generates subtasks.",
        snippets: {
          curl: `curl -X POST https://api.devflow.io/v1/issues \\
  -H "Authorization: Bearer df_live_8a39f9e2b10" \\
  -H "Content-Type: application/json" \\
  -d '{
    "projectId": "proj_phoenix",
    "title": "OAuth2 callback fails on token expiration",
    "description": "Users receive a 401 when refresh token expires during checkout flow.",
    "autoAiTriage": true
  }'`,
          typescript: `import { DevFlowClient } from "@devflow/sdk";

const devflow = new DevFlowClient({
  apiKey: process.env.DEVFLOW_API_KEY!,
});

const issue = await devflow.issues.create({
  projectId: "proj_phoenix",
  title: "OAuth2 callback fails on token expiration",
  description: "Users receive a 401 when refresh token expires during checkout flow.",
  autoAiTriage: true,
});

console.log(\`Created issue: \${issue.key} with \${issue.suggestedSubtasks.length} subtasks\`);`,
          python: `from devflow import DevFlow

client = DevFlow(api_key="df_live_8a39f9e2b10")

issue = client.issues.create(
    project_id="proj_phoenix",
    title="OAuth2 callback fails on token expiration",
    description="Users receive a 401 when refresh token expires during checkout flow.",
    auto_ai_triage=True
)

print(f"Issue created: {issue.id} | Priority: {issue.suggested_priority}")`,
          go: `package main

import (
	"context"
	"fmt"
	"github.com/devflow/devflow-go"
)

func main() {
	client := devflow.NewClient("df_live_8a39f9e2b10")

	issue, err := client.Issues.Create(context.Background(), &devflow.CreateIssueParams{
		ProjectID:    "proj_phoenix",
		Title:        "OAuth2 callback fails on token expiration",
		Description:  "Users receive a 401 when refresh token expires during checkout flow.",
		AutoAITriage: true,
	})
	if err != nil {
		panic(err)
	}

	fmt.Printf("Created issue %s: %s\\n", issue.Key, issue.Title)
}`
        }
      }
    ]
  },
  {
    id: "ai-issue-scoping",
    title: "AI Issue Scoping & Root Cause Decomposition",
    category: "Architecture & AI",
    tags: ["#ai-copilot", "#gemini", "#subtasks", "#root-cause"],
    readTime: "4 min read",
    summary: "Deep dive into how the DevFlow AI Engine leverages Gemini 3.7 to analyze crash stack traces, extract reproduction steps, and generate structured subtasks.",
    sections: [
      {
        id: "how-ai-works",
        heading: "How Gemini Analyzes Developer Reports",
        content: "When a new issue is submitted, the AI Engine evaluates the text alongside existing project context (recent commits, active labels, team member specializations, and past bugs). It enforces strict JSON schemas to output reliable engineering deliverables:",
        steps: [
          {
            step: "Semantic Triage & Categorization",
            detail: "Identifies whether the report represents a regression bug, new feature, security risk, or technical debt with a confidence score."
          },
          {
            step: "Reproduction Step Extraction",
            detail: "Converts chaotic customer tickets or logs into structured, numbered reproduction steps."
          },
          {
            step: "Actionable Subtask Decomposition",
            detail: "Generates atomic engineering subtasks with clear checkboxes for verification in staging."
          }
        ]
      }
    ]
  },
  {
    id: "cicd-pipelines",
    title: "CI/CD Ephemeral Previews & Zero-Downtime Releases",
    category: "CI/CD & DevOps",
    tags: ["#cicd", "#docker", "#cloud-run", "#deployments"],
    readTime: "4 min read",
    summary: "Set up ephemeral staging environments per GitHub PR branch with automated health checks, blue/green traffic shifting, and instant rollback safety nets.",
    sections: [
      {
        id: "ephemeral-preview-flow",
        heading: "Automated Pull Request Sandbox Environments",
        content: "Every GitHub pull request automatically spins up an isolated preview container on Cloud Run. Once the PR is approved and merged, the container is destroyed after 48 hours to eliminate idle compute waste.",
        steps: [
          {
            step: "GitHub Webhook Trigger",
            detail: "Webhook payload triggers container build in GitHub Actions or Google Cloud Build."
          },
          {
            step: "Unique DNS Generation",
            detail: "Routes traffic to https://pr-442.preview.devflow.io with staging DB seed."
          },
          {
            step: "Zero-Downtime Production Promotion",
            detail: "Blue/green traffic shifting with automatic rollback if error rate exceeds 0.5%."
          }
        ]
      }
    ]
  },
  {
    id: "agile-best-practices",
    title: "Agile Workflows, WIP Limits & Burndown Science",
    category: "Agile & Workflows",
    tags: ["#sprint-planning", "#burndown", "#kanban", "#velocity"],
    readTime: "3 min read",
    summary: "Master team capacity planning, story point estimation standards, and work-in-progress (WIP) column limits to optimize team throughput.",
    sections: [
      {
        id: "wip-limits",
        heading: "Optimizing Kanban WIP Limits",
        content: "Setting Work In Progress limits on the 'In Progress' and 'In Review' columns prevents context switching and bottlenecks. We recommend setting a max of 2 active tasks per fullstack engineer.",
        steps: [
          {
            step: "Set Column Constraints",
            detail: "Configure WIP limits in Workspace Settings > Kanban Policies."
          },
          {
            step: "Burndown Velocity Calibration",
            detail: "Compare committed story points against actual velocity over 5 sprints to eliminate over-committing."
          }
        ]
      }
    ]
  }
];

const ALL_TAGS = [
  "#all",
  "#cli",
  "#api",
  "#ai-copilot",
  "#git",
  "#github-webhooks",
  "#sprint-planning",
  "#cicd",
  "#permissions",
];

export default function DocumentationPage() {
  const [selectedArticleId, setSelectedArticleId] = useState<string>("cli-quickstart");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("curl");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("#all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Feedback State
  const [feedbackGiven, setFeedbackGiven] = useState<"up" | "down" | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const activeArticle =
    DOC_ARTICLES.find((a) => a.id === selectedArticleId) || DOC_ARTICLES[0];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitted(true);
  };

  const filteredArticles = DOC_ARTICLES.filter((article) => {
    const matchesSearch =
      searchQuery === "" ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag =
      selectedTag === "#all" ||
      article.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto text-slate-900">
      {/* ─── Top Documentation Header ────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-2xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              DevFlow Knowledge Hub &amp; Docs
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Interactive API playground, CLI quickstart, architecture guides, and engineering best practices
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Edit on GitHub</span>
          </a>
        </div>
      </div>

      {/* ─── Search Bar & Filter Tags ─────────────────────── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides, REST endpoints, CLI commands, or tags (e.g. #ai-copilot, #cicd)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
          />
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Filter by tag:</span>
          {ALL_TAGS.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTag(t)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                selectedTag === t
                  ? "bg-indigo-600 text-white shadow-2xs font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 3-Column Layout: Index, Content, Table of Contents ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ─── Left Column (3/12): Articles Navigation Index ─── */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-2xs p-3 space-y-4">
          <div className="px-2 pt-1 flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Guides &amp; Articles
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              {filteredArticles.length}
            </span>
          </div>

          <div className="space-y-1">
            {filteredArticles.map((art) => {
              const isSelected = art.id === activeArticle.id;
              return (
                <button
                  key={art.id}
                  onClick={() => {
                    setSelectedArticleId(art.id);
                    setFeedbackGiven(null);
                    setFeedbackSubmitted(false);
                    setFeedbackComment("");
                  }}
                  className={`w-full p-3 rounded-lg text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? "bg-indigo-50 border border-indigo-200 shadow-2xs"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      isSelected ? "text-indigo-600" : "text-slate-400"
                    }`}>
                      {art.category}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {art.readTime}
                    </span>
                  </div>
                  <h4 className={`text-xs font-bold leading-snug ${
                    isSelected ? "text-indigo-900" : "text-slate-800"
                  }`}>
                    {art.title}
                  </h4>
                </button>
              );
            })}

            {filteredArticles.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">
                No documentation found matching your search.
              </div>
            )}
          </div>
        </div>

        {/* ─── Center Column (6/12): Main Article Content Viewer ─── */}
        <div className="lg:col-span-6 space-y-6">
          {/* Main Article Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-6">
            {/* Breadcrumb & Meta */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Link href="/dashboard" className="hover:text-indigo-600">Docs</Link>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span className="text-indigo-600 font-semibold">{activeArticle.category}</span>
              </div>

              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {activeArticle.title}
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                {activeArticle.summary}
              </p>

              {/* Tags list */}
              <div className="flex items-center gap-1.5 flex-wrap pt-2">
                {activeArticle.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Article Sections */}
            <div className="space-y-8">
              {activeArticle.sections.map((sec) => (
                <div key={sec.id} id={sec.id} className="space-y-4 scroll-mt-24">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>{sec.heading}</span>
                  </h3>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {sec.content}
                  </p>

                  {/* Step by Step Commands */}
                  {sec.steps && (
                    <div className="space-y-3 pt-1">
                      {sec.steps.map((st, sIdx) => (
                        <div key={sIdx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-mono font-bold">
                                {sIdx + 1}
                              </span>
                              {st.step}
                            </span>
                          </div>

                          {st.cmd && (
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs shadow-inner">
                              <span className="truncate">{st.cmd}</span>
                              <button
                                onClick={() => handleCopy(st.cmd!, `step-${sIdx}`)}
                                className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer shrink-0 ml-2"
                                title="Copy command"
                              >
                                {copiedKey === `step-${sIdx}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          )}

                          <p className="text-[11px] text-slate-500">
                            {st.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Interactive Tabbed Code Playground Snippets */}
                  {sec.snippets && (
                    <div className="rounded-xl bg-slate-900 border border-slate-800 shadow-md overflow-hidden pt-2">
                      {/* Language Switcher Tabs */}
                      <div className="flex items-center justify-between px-3 border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-1.5">
                          {Object.keys(sec.snippets).map((lang) => (
                            <button
                              key={lang}
                              onClick={() => setSelectedLanguage(lang)}
                              className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold uppercase transition-colors cursor-pointer ${
                                selectedLanguage === lang
                                  ? "bg-indigo-600 text-white"
                                  : "text-slate-400 hover:text-white hover:bg-slate-800"
                              }`}
                            >
                              {lang}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() =>
                            handleCopy(
                              sec.snippets![selectedLanguage] || Object.values(sec.snippets!)[0],
                              sec.id
                            )
                          }
                          className="text-slate-400 hover:text-white flex items-center gap-1 text-xs font-medium py-1 px-2 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          {copiedKey === sec.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 text-[11px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Copy Code</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Code Snippet Box */}
                      <div className="p-4 overflow-x-auto">
                        <pre className="font-mono text-xs text-slate-200 leading-relaxed">
                          <code>{sec.snippets[selectedLanguage] || Object.values(sec.snippets)[0]}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ─── Feedback & Rating Section ───────────────── */}
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Was this article helpful?
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Your feedback helps us continuously improve the developer experience.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setFeedbackGiven("up");
                      setFeedbackSubmitted(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      feedbackGiven === "up"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Yes</span>
                  </button>

                  <button
                    onClick={() => {
                      setFeedbackGiven("down");
                      setFeedbackSubmitted(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      feedbackGiven === "down"
                        ? "bg-rose-50 border-rose-300 text-rose-700 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>No</span>
                  </button>
                </div>
              </div>

              {/* Optional feedback comment box */}
              {feedbackGiven && !feedbackSubmitted && (
                <form onSubmit={handleFeedbackSubmit} className="space-y-2 pt-2 animate-fade-in">
                  <textarea
                    rows={2}
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Optional: How can we make this guide clearer or more useful?"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Submit Feedback</span>
                    </button>
                  </div>
                </form>
              )}

              {feedbackSubmitted && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium flex items-center gap-2 animate-fade-in">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Thank you! Your feedback has been recorded.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Right Column (3/12): On This Page / Table of Contents ─── */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3 sticky top-6">
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              On This Page
            </h4>

            <nav className="space-y-1.5 text-xs">
              {activeArticle.sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="block text-slate-600 hover:text-indigo-600 hover:underline transition-colors py-1 leading-snug"
                >
                  {sec.heading}
                </a>
              ))}
            </nav>

            <div className="h-px bg-slate-100 w-full pt-1" />

            {/* Quick Links Card */}
            <div className="pt-2 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase block">
                Resources
              </span>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between text-xs text-slate-600 hover:text-indigo-600 py-1"
              >
                <span>Suggest improvements</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <Link
                href="/dashboard/settings"
                className="flex items-center justify-between text-xs text-slate-600 hover:text-indigo-600 py-1"
              >
                <span>API Keys &amp; Tokens</span>
                <Sliders className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
