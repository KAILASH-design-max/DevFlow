"use client";

import React from "react";
import {
  Scale,
  FileCheck,
  ShieldAlert,
  Code2,
  CreditCard,
  Clock,
  AlertTriangle,
  Download,
  CheckCircle2,
  Ban,
  Building2,
  Mail,
  Gavel,
  BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";

export default function TermsAndConditionsPage() {
  const effectiveDate = "August 20, 2026";
  const version = "v3.1.0";

  const handlePrint = () => {
    window.print();
  };

  const handleAcceptTerms = () => {
    toast.success("Terms & Conditions status verified. Your workspace is fully compliant.");
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-900 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
              <Scale className="w-3.5 h-3.5 text-blue-400" />
              <span>DevFlow Master Services Agreement</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span>{version}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Terms &amp; Conditions
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              These Terms of Service constitute a legally binding agreement governing your access to and use of the DevFlow platform, APIs, developer tools, and team workspaces.
            </p>
          </div>

          <div className="flex sm:flex-col items-end gap-2 flex-shrink-0 text-right">
            <span className="text-xs text-slate-400">Effective Date</span>
            <span className="text-xs font-semibold text-slate-200 bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700">
              {effectiveDate}
            </span>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print Terms</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Guarantees Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
            <Code2 className="w-4 h-4" />
            <span>100% Code Ownership</span>
          </div>
          <p className="text-xs text-slate-500">
            You retain exclusive intellectual property ownership of all repositories, code snippets, issues, and digital assets.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
            <Clock className="w-4 h-4" />
            <span>99.9% Uptime SLA</span>
          </div>
          <p className="text-xs text-slate-500">
            Enterprise and Pro workspaces are backed by our financial-grade 99.9% service availability commitment.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
            <CreditCard className="w-4 h-4" />
            <span>Transparent Billing</span>
          </div>
          <p className="text-xs text-slate-500">
            No hidden fees. Cancel or adjust your active subscription tier anytime directly in your workspace settings.
          </p>
        </div>
      </div>

      {/* Main Legal Clauses */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        
        {/* Clause 1: Acceptance of Terms */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              01
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">1. Acceptance of Terms</h3>
              <p className="text-xs text-slate-500">Binding contractual agreement</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              By creating an account, inviting workspace members, integrating GitHub repositories, or otherwise accessing DevFlow, you agree to be bound by these Terms &amp; Conditions and our Privacy Policy. If you are entering into this agreement on behalf of a company, organization, or other legal entity, you represent that you have the authority to bind such entity to these Terms.
            </p>
          </div>
        </div>

        {/* Clause 2: Account Registration & Security */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              02
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">2. Account Registration &amp; Credential Security</h3>
              <p className="text-xs text-slate-500">User obligations and security hygiene</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              You must provide accurate, complete, and current information when registering for DevFlow. You are responsible for safeguarding your login credentials, two-factor authentication recovery codes, and API tokens. You agree to immediately notify DevFlow at <span className="font-semibold text-slate-800">security@devflow.io</span> of any unauthorized use of your account or security breach.
            </p>
          </div>
        </div>

        {/* Clause 3: Acceptable Use Policy */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              03
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">3. Acceptable Use Policy</h3>
              <p className="text-xs text-slate-500">Permitted and prohibited uses of the platform</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
              <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Permitted Uses
              </h4>
              <ul className="text-xs text-emerald-800 space-y-1.5 list-disc list-inside">
                <li>Collaborative software development and issue backlog management.</li>
                <li>Automated CI/CD orchestration and pull request synchronization.</li>
                <li>AI-assisted issue analysis, sprint planning, and retrospectives.</li>
                <li>Inviting team members with role-based permission boundaries.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200/80 space-y-2">
              <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <Ban className="w-4 h-4 text-rose-600" />
                Strictly Prohibited Uses
              </h4>
              <ul className="text-xs text-rose-800 space-y-1.5 list-disc list-inside">
                <li>Uploading malware, ransomware, or malicious attack payloads.</li>
                <li>Attempting to probe, scan, or exploit DevFlow infrastructure vulnerabilities.</li>
                <li>Reverse engineering, decompiling, or creating unauthorized mirrors.</li>
                <li>Bypassing rate limits, quotas, or tenant authorization boundaries.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Clause 4: Intellectual Property & Customer Data */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              04
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">4. Intellectual Property &amp; Ownership</h3>
              <p className="text-xs text-slate-500">Uncompromising rights to your proprietary software</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              <strong className="text-slate-900">Customer Content:</strong> You retain all right, title, and interest in and to all code, issue tickets, attachments, discussions, and assets you submit to DevFlow. DevFlow claims zero ownership rights over your intellectual property.
            </p>
            <p>
              <strong className="text-slate-900">DevFlow IP:</strong> The DevFlow platform, trademarks, software architecture, UI design, documentation, and APIs are the exclusive property of DevFlow Inc. and are protected by applicable copyright, patent, and trademark laws.
            </p>
          </div>
        </div>

        {/* Clause 5: Subscription, Billing & Refund Policy */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              05
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">5. Subscriptions, Fees &amp; Cancellation</h3>
              <p className="text-xs text-slate-500">Transparent pricing, seat limits, and refund terms</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              Paid subscription plans (e.g., Team Pro, Enterprise Scale) are billed in advance on a monthly or annual recurring cycle. Workspace administrators may cancel or modify subscriptions at any time via Settings &gt; Billing. Cancellations take effect at the conclusion of the current billing period with zero cancellation penalties.
            </p>
            <p>
              We offer a <strong className="text-slate-900">14-day money-back guarantee</strong> for new paid subscriptions. Contact <span className="font-semibold text-slate-800">billing@devflow.io</span> for invoice inquiries or refund requests.
            </p>
          </div>
        </div>

        {/* Clause 6: Service Level Agreement (SLA) */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              06
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">6. Service Level Agreement (SLA) &amp; Uptime</h3>
              <p className="text-xs text-slate-500">Availability commitments and maintenance windows</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              DevFlow targets 99.9% uptime for all core REST APIs, WebSocket real-time event distribution, and dashboard interfaces. Scheduled maintenance windows will be communicated at least 48 hours in advance via dashboard notification banners and email alerts.
            </p>
          </div>
        </div>

        {/* Clause 7: Limitation of Liability */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              07
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">7. Limitation of Liability &amp; Disclaimers</h3>
              <p className="text-xs text-slate-500">Legal liability boundaries and warranties</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              To the maximum extent permitted by applicable law, DevFlow and its suppliers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or goodwill, arising out of or in connection with your use of the Services. In no event shall DevFlow&apos;s aggregate liability exceed the total fees paid by you in the preceding 12 months.
            </p>
          </div>
        </div>

        {/* Clause 8: Governing Law & Contact */}
        <div className="p-6 sm:p-8 space-y-4 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              08
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">8. Governing Law &amp; Legal Notices</h3>
              <p className="text-xs text-slate-500">Jurisdiction, dispute resolution, and legal contact</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions. Any legal action or proceeding arising under these Terms will be brought exclusively in federal or state courts located in Delaware.
            </p>
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 inline-block min-w-[320px]">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <Gavel className="w-4 h-4 text-blue-600" />
                <span>DevFlow Legal &amp; Compliance Department</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 text-xs">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <a href="mailto:legal@devflow.io" className="text-blue-600 hover:underline font-medium">
                  legal@devflow.io
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
