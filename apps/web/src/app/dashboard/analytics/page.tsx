"use client";

import { useState } from "react";
import {
  TrendingUp,
  Clock,
  CheckCircle,
  Sparkles,
  Calendar,
  Layers,
  ArrowUpRight,
  Target,
  BarChart3,
  Sliders,
  GitPullRequest,
  Zap,
  Activity,
  Bug,
  ShieldCheck,
  CheckCircle2,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";

interface VelocityDataPoint {
  week: string;
  shortWeek: string;
  completed: number;
  remaining: number;
  totalCommitted: number;
  completionRate: number;
  aiAssisted: number;
}

const FOUR_WEEK_VELOCITY: VelocityDataPoint[] = [
  {
    week: "Week 1 (Aug 1 - 7)",
    shortWeek: "Week 1",
    completed: 28,
    remaining: 6,
    totalCommitted: 34,
    completionRate: 82.4,
    aiAssisted: 12,
  },
  {
    week: "Week 2 (Aug 8 - 14)",
    shortWeek: "Week 2",
    completed: 34,
    remaining: 4,
    totalCommitted: 38,
    completionRate: 89.5,
    aiAssisted: 16,
  },
  {
    week: "Week 3 (Aug 15 - 21)",
    shortWeek: "Week 3",
    completed: 42,
    remaining: 3,
    totalCommitted: 45,
    completionRate: 93.3,
    aiAssisted: 22,
  },
  {
    week: "Week 4 (Current)",
    shortWeek: "Week 4",
    completed: 37,
    remaining: 7,
    totalCommitted: 44,
    completionRate: 84.1,
    aiAssisted: 19,
  },
];

const HISTORICAL_SPRINTS = [
  { sprint: "Sprint 38", completed: 38, committed: 42 },
  { sprint: "Sprint 39", completed: 42, committed: 45 },
  { sprint: "Sprint 40", completed: 45, committed: 44 },
  { sprint: "Sprint 41", completed: 44, committed: 46 },
  { sprint: "Sprint 42", completed: 48, committed: 48 },
];

const LEAD_TIME_PHASES = [
  { phase: "Triage & Backlog", duration: "18.5h", percentage: 22, color: "#64748b", desc: "Issue created ➔ Moved to IN_PROGRESS" },
  { phase: "Active Development", duration: "32.0h", percentage: 38, color: "#4f46e5", desc: "Coding & local tests ➔ PR opened" },
  { phase: "PR Review & CI", duration: "8.5h", percentage: 10, color: "#06b6d4", desc: "Code review & automated tests ➔ Merged" },
  { phase: "Testing & Verification", duration: "14.0h", percentage: 17, color: "#8b5cf6", desc: "PR Merged ➔ TESTING column verification" },
  { phase: "Deployment & Done", duration: "11.0h", percentage: 13, color: "#10b981", desc: "Staging release ➔ DONE" },
];

const MTTR_SEVERITIES = [
  { priority: "CRITICAL", mttr: "3.8h", targetSla: "6.0h", compliance: "100%", color: "#ef4444", count: 4 },
  { priority: "HIGH", mttr: "18.2h", targetSla: "24.0h", compliance: "96%", color: "#f97316", count: 12 },
  { priority: "MEDIUM", mttr: "42.0h", targetSla: "72.0h", compliance: "98%", color: "#3b82f6", count: 18 },
  { priority: "LOW", mttr: "96.0h", targetSla: "168.0h", compliance: "95%", color: "#64748b", count: 8 },
];

const TEAM_VELOCITY = [
  { name: "Alice Chen", role: "Engineering Lead", completed: 14, inProgress: 2, avgCycleTime: "2.1 days", avatar: "AC", color: "#4f46e5" },
  { name: "Bob Martinez", role: "Fullstack Engineer", completed: 16, inProgress: 3, avgCycleTime: "2.4 days", avatar: "BM", color: "#0284c7" },
  { name: "Carol Zhang", role: "QA Lead", completed: 12, inProgress: 1, avgCycleTime: "1.8 days", avatar: "CZ", color: "#10b981" },
  { name: "David Kim", role: "DevOps Engineer", completed: 8, inProgress: 1, avgCycleTime: "2.8 days", avatar: "DK", color: "#8b5cf6" },
];

export default function AnalyticsPage() {
  const [chartMode, setChartMode] = useState<"grouped" | "stacked">("grouped");
  const [timeframe, setTimeframe] = useState<"7d" | "4w" | "90d">("4w");

  const totalCompleted = FOUR_WEEK_VELOCITY.reduce((acc, curr) => acc + curr.completed, 0);
  const totalRemaining = FOUR_WEEK_VELOCITY.reduce((acc, curr) => acc + curr.remaining, 0);
  const totalCommitted = FOUR_WEEK_VELOCITY.reduce((acc, curr) => acc + curr.totalCommitted, 0);
  const totalAi = FOUR_WEEK_VELOCITY.reduce((acc, curr) => acc + curr.aiAssisted, 0);
  const avgCompletionRate = ((totalCompleted / totalCommitted) * 100).toFixed(1);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Engineering Analytics &amp; Cycle Time
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Lead time, cycle time (Creation ➔ PR Merged ➔ Verified), sprint velocity, and MTTR SLA adherence
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            {(["7d", "4w", "90d"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  timeframe === t
                    ? "bg-white text-indigo-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t === "7d" ? "Last 7 Days" : t === "4w" ? "Last 4 Weeks" : "Last 90 Days"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Top 4 KPI Metrics ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Avg Lead Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Avg Lead Time
            </span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900">
            3.4 <span className="text-sm font-normal text-slate-500">days</span>
          </span>
          <span className="text-xs text-emerald-700 font-semibold block mt-1">
            &darr; 14.2% faster vs last sprint
          </span>
        </div>

        {/* Metric 2: Avg Cycle Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Avg Cycle Time
            </span>
            <Activity className="w-4 h-4 text-cyan-600" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900">
            2.7 <span className="text-sm font-normal text-slate-500">days</span>
          </span>
          <span className="text-xs text-emerald-700 font-semibold block mt-1">
            Creation ➔ PR Merged ➔ Verified
          </span>
        </div>

        {/* Metric 3: Bug MTTR */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Bug MTTR (Mean Resolution)
            </span>
            <Bug className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900">
            16.4 <span className="text-sm font-normal text-slate-500">hrs</span>
          </span>
          <span className="text-xs text-emerald-700 font-semibold block mt-1">
            97.5% SLA Compliance Rate
          </span>
        </div>

        {/* Metric 4: AI Delivery Efficiency */}
        <div className="bg-gradient-to-br from-purple-50 via-indigo-50/40 to-white p-5 rounded-2xl border border-purple-200/80 shadow-2xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold uppercase text-purple-900 tracking-wider">
              AI-Assisted Workload
            </span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-3xl font-extrabold text-purple-950">{totalAi} tasks</span>
          <span className="text-xs text-purple-700 font-semibold block mt-1">
            {((totalAi / totalCompleted) * 100).toFixed(0)}% of deliverables triaged by AI
          </span>
        </div>
      </div>

      {/* ─── Phase 18: Lead Time & Cycle Time Pipeline ─── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-indigo-600" />
              Lead Time vs. Cycle Time Pipeline Breakdown
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracing issues through every milestone: Creation &rarr; Active Dev &rarr; PR Merged &rarr; Testing &rarr; Verified
            </p>
          </div>
          <div className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
            Total Pipeline Duration: 84h (~3.5 Days)
          </div>
        </div>

        {/* Stage Progress Bar */}
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            {LEAD_TIME_PHASES.map((p, i) => (
              <div
                key={i}
                style={{ width: `${p.percentage}%`, background: p.color }}
                className="h-full transition-all hover:opacity-80 cursor-pointer"
                title={`${p.phase}: ${p.duration} (${p.percentage}%)`}
              />
            ))}
          </div>

          {/* Phase Detail Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            {LEAD_TIME_PHASES.map((p, i) => (
              <div key={i} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                  <span className="text-xs font-bold text-slate-800 truncate">{p.phase}</span>
                </div>
                <div className="text-base font-extrabold text-slate-900 font-mono">
                  {p.duration} <span className="text-[11px] font-normal text-slate-500">({p.percentage}%)</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Sprint Velocity Chart: Completed vs. Remaining Tasks ─── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Sprint Velocity: Committed vs. Delivered Deliverables (Last 4 Weeks)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Visualizing weekly committed workload, completed deliverables, and unfinished tasks
            </p>
          </div>

          {/* Chart View Mode Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">View Layout:</span>
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
              <button
                onClick={() => setChartMode("grouped")}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  chartMode === "grouped"
                    ? "bg-white text-indigo-700 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Side-by-Side
              </button>
              <button
                onClick={() => setChartMode("stacked")}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  chartMode === "stacked"
                    ? "bg-white text-indigo-700 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Stacked Total
              </button>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={FOUR_WEEK_VELOCITY}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="shortWeek"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                label={{
                  value: "Task Count",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#94a3b8",
                  fontSize: 11,
                  offset: 20,
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as VelocityDataPoint;
                    return (
                      <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-lg text-xs space-y-2">
                        <div className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center justify-between gap-3">
                          <span>{data.week}</span>
                          <span className="font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold text-[10px]">
                            {data.completionRate}% Done
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-slate-600">
                              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
                              Completed Tasks:
                            </span>
                            <strong className="text-slate-900 font-mono">{data.completed}</strong>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-slate-600">
                              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                              Remaining / Rollover:
                            </span>
                            <strong className="text-slate-900 font-mono">{data.remaining}</strong>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-slate-600">
                              <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                              AI-Assisted Tasks:
                            </span>
                            <strong className="text-slate-900 font-mono">{data.aiAssisted}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }}
                formatter={(value) => {
                  if (value === "completed") return <span className="text-slate-700 font-medium">Completed Tasks</span>;
                  if (value === "remaining") return <span className="text-slate-700 font-medium">Remaining Tasks (Rollover)</span>;
                  return value;
                }}
              />
              <Bar
                dataKey="completed"
                fill="#4f46e5"
                radius={chartMode === "stacked" ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                stackId={chartMode === "stacked" ? "a" : undefined}
                name="completed"
              />
              <Bar
                dataKey="remaining"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                stackId={chartMode === "stacked" ? "a" : undefined}
                name="remaining"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Bug MTTR Matrix & Team Member Throughput Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MTTR by Bug Severity SLA */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Bug MTTR &amp; SLA Compliance
              </h3>
              <p className="text-xs text-slate-500">Mean Time To Resolution by severity tier</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              97.5% Compliant
            </span>
          </div>

          <div className="space-y-3">
            {MTTR_SEVERITIES.map((s) => (
              <div
                key={s.priority}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                  <div>
                    <span className="font-bold text-slate-900">{s.priority} Severity</span>
                    <span className="text-[11px] text-slate-500 block">
                      Target SLA: {s.targetSla} ({s.count} bugs resolved)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-extrabold text-slate-900 text-sm">
                    {s.mttr}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 block">
                    {s.compliance} SLA Match
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Member Throughput */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Team Member Throughput
              </h3>
              <p className="text-xs text-slate-500">Tasks delivered &amp; individual cycle times</p>
            </div>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="space-y-3">
            {TEAM_VELOCITY.map((member) => (
              <div
                key={member.name}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-2xs"
                    style={{ background: member.color }}
                  >
                    {member.avatar}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">{member.name}</span>
                    <span className="text-[11px] text-slate-500 block">{member.role}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-extrabold text-slate-900 text-sm">
                    {member.completed} <span className="text-xs font-normal text-slate-500">completed</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 block">
                    Avg Cycle: {member.avgCycleTime}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
