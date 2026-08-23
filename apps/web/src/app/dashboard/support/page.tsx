"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Sparkles,
  Send,
  Activity,
  CheckCircle2,
  AlertTriangle,
  LifeBuoy,
  MessageSquare,
  Ticket,
  Plus,
  X,
  UploadCloud,
  FileText,
  Users,
  ExternalLink,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Search,
  Bot,
  User,
  Check,
  ShieldAlert,
  Clock,
} from "lucide-react";

interface DiagnosticMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  time: string;
  steps?: string[];
  docLink?: { title: string; href: string };
}

interface SupportTicket {
  id: string;
  title: string;
  category: "Technical Bug" | "Billing / Account" | "Feature Request" | "Security Vulnerability";
  priority: "Urgent" | "High" | "Normal";
  status: "Under Review" | "Investigating" | "Resolved";
  assignedTo: string;
  createdAt: string;
}

const PRESET_QUESTIONS = [
  "Why is my PR webhook not triggering?",
  "How do I restore an archived task?",
  "How to configure custom WIP limits for Kanban?",
  "How do I rotate my DevFlow API Token?",
];

const INITIAL_MESSAGES: DiagnosticMessage[] = [
  {
    id: "m-init",
    sender: "ai",
    text: "Hello! I am your DevFlow AI Diagnostics Assistant. Ask me any troubleshooting questions about webhooks, CI/CD pipelines, API integrations, or permission policies.",
    time: "Just now",
  },
];

const KNOWLEDGE_RESPONSES: Record<string, { text: string; steps: string[]; docLink: { title: string; href: string } }> = {
  webhook: {
    text: "Here is the step-by-step diagnostic checklist to resolve GitHub PR webhook delivery issues:",
    steps: [
      "Check your GitHub Repository Settings > Webhooks to verify payload deliveries aren't returning 401 Unauthorized or 404.",
      "Verify the Webhook Secret in Workspace Settings > Integrations matches the GitHub webhook secret.",
      "Ensure the webhook events include 'Pull requests', 'Issue comments', and 'Workflow runs'.",
      "Run `devflow webhook test --repo org/repo` in your terminal to simulate a mock GitHub delivery."
    ],
    docLink: { title: "CI/CD & Webhook Troubleshooting Guide", href: "/dashboard/docs" },
  },
  archive: {
    text: "To restore an archived or soft-deleted task in DevFlow:",
    steps: [
      "Navigate to Issues & Backlog from the sidebar (or press G then I).",
      "Click the 'Filters' dropdown and toggle 'Include Archived Issues'.",
      "Locate the issue card, click the three-dots (...) menu, and select 'Restore to Active Backlog'.",
      "The issue will instantly reappear on your active sprint board."
    ],
    docLink: { title: "Issue Backlog Management", href: "/dashboard/docs" },
  },
  wip: {
    text: "To customize Work In Progress (WIP) column limits:",
    steps: [
      "Open Workspace Settings > Kanban Policies (press G then S).",
      "Locate the column configuration section for 'In Progress' and 'In Review'.",
      "Set your desired numerical capacity limit (recommended: 2 tasks per active engineer).",
      "Enable 'Enforce Soft Warning' or 'Hard Block' on drag-and-drop operations."
    ],
    docLink: { title: "Agile WIP Limits & Burndown Science", href: "/dashboard/docs" },
  },
  token: {
    text: "To safely rotate your DevFlow API access token with zero downtime:",
    steps: [
      "Go to Workspace Settings > API & Developer Keys.",
      "Click 'Generate Secondary Token' to create a new token without invalidating the active one.",
      "Update your CI/CD runner secrets and CLI credentials (`devflow login --token ...`).",
      "Click 'Revoke Primary Token' once you confirm requests are succeeding on the new token."
    ],
    docLink: { title: "API Authentication & Token Management", href: "/dashboard/docs" },
  },
};

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: "SUP-8821",
    title: "Webhook delivery failure on branch feature/auth-v2",
    category: "Technical Bug",
    priority: "High",
    status: "Investigating",
    assignedTo: "Marcus Vance (DevOps Lead)",
    createdAt: "2 hours ago",
  },
  {
    id: "SUP-8794",
    title: "Need SSO SAML 2.0 provisioning for Okta",
    category: "Feature Request",
    priority: "Normal",
    status: "Under Review",
    assignedTo: "Sarah Jenkins (Enterprise Support)",
    createdAt: "Yesterday",
  },
  {
    id: "SUP-8650",
    title: "Invoice clarification for seat upgrades in Q3",
    category: "Billing / Account",
    priority: "Normal",
    status: "Resolved",
    assignedTo: "Billing Desk",
    createdAt: "3 days ago",
  },
];

export default function SupportPage() {
  const [messages, setMessages] = useState<DiagnosticMessage[]>(INITIAL_MESSAGES);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Ticket Modal State
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketCategory, setTicketCategory] = useState<SupportTicket["category"]>("Technical Bug");
  const [ticketPriority, setTicketPriority] = useState<SupportTicket["priority"]>("Normal");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketSubmittedToast, setTicketSubmittedToast] = useState(false);

  const handleSendPrompt = (questionText: string) => {
    if (!questionText.trim()) return;

    const userMsg: DiagnosticMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: questionText,
      time: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion("");
    setIsAiTyping(true);

    setTimeout(() => {
      const lower = questionText.toLowerCase();
      let matched = KNOWLEDGE_RESPONSES.webhook;

      if (lower.includes("archive") || lower.includes("restore") || lower.includes("deleted")) {
        matched = KNOWLEDGE_RESPONSES.archive;
      } else if (lower.includes("wip") || lower.includes("limit") || lower.includes("kanban")) {
        matched = KNOWLEDGE_RESPONSES.wip;
      } else if (lower.includes("token") || lower.includes("key") || lower.includes("rotate") || lower.includes("api")) {
        matched = KNOWLEDGE_RESPONSES.token;
      }

      const aiMsg: DiagnosticMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: matched.text,
        time: "Just now",
        steps: matched.steps,
        docLink: matched.docLink,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsAiTyping(false);
    }, 800);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim()) return;

    const newTicket: SupportTicket = {
      id: `SUP-${Math.floor(1000 + Math.random() * 9000)}`,
      title: ticketTitle,
      category: ticketCategory,
      priority: ticketPriority,
      status: "Under Review",
      assignedTo: "Support Triage Queue",
      createdAt: "Just now",
    };

    setTickets((prev) => [newTicket, ...prev]);
    setIsTicketModalOpen(false);
    setTicketTitle("");
    setTicketDescription("");
    setTicketSubmittedToast(true);
    setTimeout(() => setTicketSubmittedToast(false), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto text-slate-900">
      {/* ─── Header & Top Actions ────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-2xs">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Help Center &amp; Support Hub
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Interactive AI Copilot diagnostics, real-time service health, support tickets, and developer community
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsTicketModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Open Support Ticket</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {ticketSubmittedToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Your support ticket has been submitted. An engineering support specialist will review it shortly.</span>
          </div>
          <span className="font-mono font-bold text-[11px] text-emerald-700">Ticket Active</span>
        </div>
      )}

      {/* ─── Real-Time System Health & Status ─────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              System Health &amp; Service Status
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Last checked 12s ago</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">API &amp; Webhooks</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">99.98% uptime</p>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">AI Copilot Pipeline</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">310ms avg latency</p>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">GitHub Sync Engine</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">0 delivery queues</p>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">Cloud Deployments</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">US-East &amp; EU Clusters</p>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
          </div>
        </div>
      </div>

      {/* ─── 2-Column Grid: AI Diagnostics & Active Tickets ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ─── Left Column (7/12): Interactive AI Diagnostics Copilot ─ */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
          {/* Diagnostic Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Interactive AI Troubleshooting Assistant
                </h3>
                <p className="text-[11px] text-slate-500">
                  Step-by-step diagnostic resolution sourced from live DevFlow documentation
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Copilot Active
            </span>
          </div>

          {/* Quick preset questions */}
          <div className="p-3 bg-slate-50/40 border-b border-slate-100 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Suggested:
            </span>
            {PRESET_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendPrompt(q)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer shadow-2xs"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat / Messages Box */}
          <div className="p-4 space-y-4 max-h-[420px] min-h-[300px] overflow-y-auto bg-white">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${
                  m.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.sender === "ai" && (
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-indigo-600 text-white rounded-br-xs shadow-2xs"
                      : "bg-slate-50 border border-slate-200/90 text-slate-800 rounded-bl-xs shadow-2xs space-y-2.5"
                  }`}
                >
                  <p>{m.text}</p>

                  {/* Numbered Steps */}
                  {m.steps && (
                    <div className="space-y-1.5 pt-1">
                      {m.steps.map((st, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200/70">
                          <span className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-[11px] text-slate-700">{st}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Doc Reference Link */}
                  {m.docLink && (
                    <div className="pt-1">
                      <Link
                        href={m.docLink.href}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Read full guide: {m.docLink.title}</span>
                      </Link>
                    </div>
                  )}
                </div>

                {m.sender === "user" && (
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isAiTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                <span>DevFlow AI is analyzing knowledge base and diagnostic logs...</span>
              </div>
            )}
          </div>

          {/* Prompt Input Box */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt(inputQuestion);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="Ask any question (e.g. 'Why is my PR webhook failing?')..."
                className="flex-1 px-3.5 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
              />
              <button
                type="submit"
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors cursor-pointer shrink-0 shadow-2xs"
                title="Send Question"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* ─── Right Column (5/12): Active Support Ticket Tracker ─ */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Tickets List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Active Support Tickets
                </h3>
              </div>
              <button
                onClick={() => setIsTicketModalOpen(true)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                + New Ticket
              </button>
            </div>

            <div className="space-y-2.5">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600">
                        {t.id}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-200/80 text-slate-700">
                        {t.category}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        t.status === "Resolved"
                          ? "bg-emerald-100 text-emerald-800"
                          : t.status === "Investigating"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {t.title}
                  </h4>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/40">
                    <span>Assigned: <strong className="text-slate-700 font-semibold">{t.assignedTo}</strong></span>
                    <span>{t.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Community & Developer Resources ───────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5">
              Developer Community &amp; Resources
            </h3>

            <div className="space-y-2">
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 flex items-center justify-between transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-900">
                      Join DevFlow Community
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Discord &amp; Slack workspace with 14,000+ developers
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
              </a>

              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 flex items-center justify-between transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-900">
                      GitHub Discussions
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Feature requests, roadmap RFCs, and bug reports
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
              </a>

              <a
                href="#"
                className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 flex items-center justify-between transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-900">
                      Book Office Hours
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      1-on-1 architecture review with DevFlow Core engineers
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Support Ticket & Bug Reporter Submission Modal ── */}
      {isTicketModalOpen && (
        <div
          onClick={() => setIsTicketModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Create Support Request
                  </h3>
                  <p className="text-xs text-slate-500">
                    Submit technical bug reports, billing issues, or feature requests
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTicketModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  required
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  placeholder="e.g. Webhook delivery failing on feature branch"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Category
                  </label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg text-xs text-slate-900 outline-none"
                  >
                    <option>Technical Bug</option>
                    <option>Billing / Account</option>
                    <option>Feature Request</option>
                    <option>Security Vulnerability</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Priority
                  </label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg text-xs text-slate-900 outline-none"
                  >
                    <option>Normal</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Detailed Description &amp; Reproduction Steps
                </label>
                <textarea
                  rows={4}
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  placeholder="Include error messages, reproduction steps, or relevant commit SHAs..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                />
              </div>

              {/* Upload Screenshot / Log zone */}
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-1 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer">
                <UploadCloud className="w-5 h-5 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">
                  Click to attach error screenshots or log files
                </p>
                <p className="text-[10px] text-slate-400">
                  PNG, JPG, or TXT up to 25MB
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
