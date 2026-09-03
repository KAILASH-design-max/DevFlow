"use client";

import React, { useState } from "react";
import {
  Shield,
  Lock,
  Eye,
  FileText,
  CheckCircle2,
  Server,
  Database,
  Globe,
  UserCheck,
  Download,
  ExternalLink,
  Mail,
  Building,
  RefreshCw,
  HelpCircle,
  KeyRound,
  FileCheck,
} from "lucide-react";
import toast from "react-hot-toast";

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState<string>("overview");

  const lastUpdated = "August 20, 2026";
  const version = "v2.4.0";

  const handleExportData = () => {
    toast.success("Preparing your personal data export package (JSON). Download will start shortly.");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-900 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>DevFlow Privacy &amp; Data Protection</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              <span>{version}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Privacy Policy
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              We are committed to safeguarding your private code, workspace data, and identity. Learn how we collect, protect, process, and respect your personal information across DevFlow.
            </p>
          </div>

          <div className="flex sm:flex-col items-end gap-2 flex-shrink-0 text-right">
            <span className="text-xs text-slate-400">Last Revised</span>
            <span className="text-xs font-semibold text-slate-200 bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700">
              {lastUpdated}
            </span>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print / Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Lock,
            title: "Zero Model Training",
            desc: "Your code and issues are NEVER used to train public AI models.",
            color: "text-emerald-600 bg-emerald-50 border-emerald-200",
          },
          {
            icon: Database,
            title: "AES-256 Encryption",
            desc: "All workspace content and attachments are encrypted at rest & transit.",
            color: "text-indigo-600 bg-indigo-50 border-indigo-200",
          },
          {
            icon: Globe,
            title: "GDPR & CCPA Ready",
            desc: "Full rights to access, export, rectify, or purge all personal data.",
            color: "text-blue-600 bg-blue-50 border-blue-200",
          },
          {
            icon: UserCheck,
            title: "Strict Role Scoping",
            desc: "Granular RBAC controls ensure only verified team members see your data.",
            color: "text-purple-600 bg-purple-50 border-purple-200",
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs transition-all space-y-2"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
              </div>
              <p className="text-xs text-slate-500 leading-normal">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Main Content Sections */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        
        {/* Section 1: Overview & Scope */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
              01
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">1. Overview &amp; Scope</h3>
              <p className="text-xs text-slate-500">Who we are and how this policy applies to you</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              DevFlow Inc. (&quot;DevFlow&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides an intelligent development workspace, issue tracking, and automated workflow orchestrator. This Privacy Policy describes how we collect, store, process, and disclose information when you access or use our web applications, APIs, command-line tools, extensions, and related services (collectively, the &quot;Services&quot;).
            </p>
            <p>
              By accessing or using DevFlow, you acknowledge that you have read and understood this Privacy Policy. If you do not agree with our policies and practices, please do not use our Services.
            </p>
          </div>
        </div>

        {/* Section 2: Information We Collect */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
              02
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">2. Information We Collect</h3>
              <p className="text-xs text-slate-500">The categories of personal and operational data we receive</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Information You Provide Directly
              </h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li><strong className="text-slate-800">Account Information:</strong> Name, email address, password hash (Argon2id), avatar, job title, and bio.</li>
                <li><strong className="text-slate-800">Workspace Content:</strong> Projects, tasks, issues, sprint backlogs, comments, labels, and uploaded attachments.</li>
                <li><strong className="text-slate-800">Credentials &amp; Tokens:</strong> Personal Access Tokens (PATs) and OAuth tokens (securely encrypted with AES-256-GCM).</li>
                <li><strong className="text-slate-800">Billing Information:</strong> Payment card details processed securely via PCI-DSS compliant providers (Stripe). DevFlow never stores full credit card numbers.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                Information Collected Automatically
              </h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li><strong className="text-slate-800">Log &amp; Usage Data:</strong> IP addresses, browser user agent, operating system, pages visited, timestamps, and request IDs.</li>
                <li><strong className="text-slate-800">Session &amp; Security Audits:</strong> Active login sessions, device fingerprints, and multi-factor authentication statuses.</li>
                <li><strong className="text-slate-800">Telemetry &amp; Performance:</strong> API response latencies, error stack traces, and feature utilization statistics.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 3: AI Privacy Guarantee */}
        <div className="p-6 sm:p-8 space-y-4 bg-indigo-50/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              03
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">3. Artificial Intelligence &amp; Copilot Data Privacy</h3>
              <p className="text-xs text-indigo-700 font-medium">Strict zero-retention and zero-training commitments</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              DevFlow incorporates AI-assisted capabilities including issue breakdown, automatic duplicate detection, retrospective generation, and pull request summarization. We adhere to the highest standard of AI privacy:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-lg bg-white border border-indigo-200 text-xs space-y-1">
                <p className="font-bold text-slate-900">1. No Model Training</p>
                <p className="text-slate-500">Your proprietary codebase, sprint data, and issue details are never utilized to train foundation models.</p>
              </div>
              <div className="p-3.5 rounded-lg bg-white border border-indigo-200 text-xs space-y-1">
                <p className="font-bold text-slate-900">2. Ephemeral Processing</p>
                <p className="text-slate-500">Prompt payloads transmitted to AI provider APIs (Google Gemini / OpenAI) are processed statelessly without persistence.</p>
              </div>
              <div className="p-3.5 rounded-lg bg-white border border-indigo-200 text-xs space-y-1">
                <p className="font-bold text-slate-900">3. Tenant Isolation</p>
                <p className="text-slate-500">Prompts are strictly scoped to the authenticated workspace and project context with complete logical boundary isolation.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: How We Use Your Information */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
              04
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">4. How We Use Your Information</h3>
              <p className="text-xs text-slate-500">The legal bases and purposes for data processing</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <p>We process your data exclusively for the following legitimate purposes:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 list-none p-0">
              {[
                "Providing, maintaining, and enhancing the DevFlow platform.",
                "Authenticating user identities and enforcing multi-factor security.",
                "Routing notifications, team mentions, and project updates in real time.",
                "Detecting, investigating, and preventing malicious security incidents.",
                "Calculating usage quotas (storage, seats, AI tokens) for billing.",
                "Fulfilling statutory and legal compliance obligations.",
              ].map((reason, i) => (
                <li key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Section 5: Data Security & Storage */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
              05
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">5. Security Safeguards &amp; Storage Architecture</h3>
              <p className="text-xs text-slate-500">Industry-grade controls protecting your engineering assets</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              We implement comprehensive technical and organizational measures designed to protect your personal data from accidental loss, unauthorized access, alteration, and disclosure:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Server className="w-4 h-4 text-indigo-600" />
                  <span>Encryption at Rest &amp; Transit</span>
                </div>
                <p className="text-slate-500">
                  All HTTP traffic is strictly enforced over TLS 1.3 with HSTS. Database records, files, and secrets are encrypted with AES-256.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <KeyRound className="w-4 h-4 text-purple-600" />
                  <span>Token Rotation &amp; Session Invalidation</span>
                </div>
                <p className="text-slate-500">
                  Automatic refresh token family reuse detection instantly invalidates compromised sessions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Your Data Rights & GDPR / CCPA */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
              06
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">6. Your Rights (GDPR, CCPA &amp; Global Privacy)</h3>
              <p className="text-xs text-slate-500">Exercise full control over your personal data at any time</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              Regardless of your geographic location, DevFlow grants all registered users comprehensive data privacy rights:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <strong className="text-slate-800 block">Right to Access &amp; Portability</strong>
                <span>Request a complete machine-readable copy of your profile and workspace history.</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <strong className="text-slate-800 block">Right to Rectification</strong>
                <span>Modify incorrect profile data, usernames, and organization associations directly in Settings.</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <strong className="text-slate-800 block">Right to Erasure (Be Forgotten)</strong>
                <span>Permanently delete your account and all associated workspace records upon request.</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <strong className="text-slate-800 block">Right to Opt-Out</strong>
                <span>Disable non-essential email notifications, marketing communications, and telemetry logging.</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportData}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export My Personal Data (JSON)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 7: Contact Data Protection Officer */}
        <div className="p-6 sm:p-8 space-y-4 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
              07
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">7. Data Protection Inquiries &amp; DPO Contact</h3>
              <p className="text-xs text-slate-500">Reach our dedicated privacy and security compliance team</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data handling practices, please contact our Data Protection Officer:
            </p>
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 inline-block min-w-[320px]">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <Building className="w-4 h-4 text-indigo-600" />
                <span>DevFlow Privacy &amp; Security Office</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 text-xs">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <a href="mailto:privacy@devflow.io" className="text-indigo-600 hover:underline font-medium">
                  privacy@devflow.io
                </a>
              </div>
              <p className="text-[11px] text-slate-400">
                Average response time: within 24 business hours
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
