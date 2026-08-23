"use client";

import { 
  GitPullRequest, 
  GitMerge, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  Plus,
  MessageSquare,
  Search,
  RefreshCw,
  Github,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { workspaceApi, projectApi, githubApi } from '../../../lib/api';

const MOCK_PRS = [
  {
    id: "PR-442",
    title: "feat(auth): Add OAuth2 social logins and token renewal",
    branch: "feat/oauth2-flow",
    url: "https://github.com",
    state: "OPEN",
    author: { name: "Sarah Jenkins", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" },
    createdAt: "2 hours ago",
    additions: 342,
    deletions: 48,
    checksStatus: "passing" as const,
    reviewers: [
      { id: "r1", name: "Alice Chen", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" },
      { id: "r2", name: "Bob Martinez", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" }
    ]
  },
  {
    id: "PR-440",
    title: "fix(checkout): Fix zero-total coupon discount boundary bug",
    branch: "fix/coupon-validator",
    url: "https://github.com",
    state: "OPEN",
    author: { name: "Bob Martinez", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" },
    createdAt: "5 hours ago",
    additions: 84,
    deletions: 12,
    checksStatus: "passing" as const,
    reviewers: [
      { id: "r1", name: "Alice Chen", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" }
    ]
  },
  {
    id: "PR-439",
    title: "perf(db): Optimize issue indexing and cache lookups",
    branch: "perf/metrics-query",
    url: "https://github.com",
    state: "OPEN",
    author: { name: "David Kim", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80" },
    createdAt: "1 day ago",
    additions: 156,
    deletions: 92,
    checksStatus: "pending" as const,
    reviewers: [
      { id: "r3", name: "Carol Zhang", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80" }
    ]
  }
];

export default function PullRequestsPage() {
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [connectedRepo, setConnectedRepo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const wsRes = await workspaceApi.list();
      if (wsRes.success && wsRes.data.length > 0) {
        const projRes = await projectApi.list(wsRes.data[0].id);
        if (projRes.success && projRes.data.length > 0) {
          setProjects(projRes.data);
          const firstProjId = projRes.data[0].id;
          setSelectedProjectId(firstProjId);
          await loadRepo(firstProjId);
        }
      }
    } catch (err) {
      console.error("Failed to load PRs data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadRepo = async (projectId: string) => {
    try {
      const repoRes = await githubApi.getRepo(projectId);
      if (repoRes.success) {
        setConnectedRepo(repoRes.data);
      }
    } catch (err) {
      console.error("Failed to load repo:", err);
    }
  };

  const handleSync = async () => {
    if (!selectedProjectId) return;
    setSyncing(true);
    try {
      await githubApi.syncPrs(selectedProjectId);
      await loadRepo(selectedProjectId);
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  };

  const activePRs = connectedRepo?.pullRequests && connectedRepo.pullRequests.length > 0
    ? connectedRepo.pullRequests.map((p: any) => ({
        id: `PR-#${p.number}`,
        title: p.title,
        branch: p.branch,
        url: p.url,
        state: p.state,
        author: {
          name: p.authorName || "Unknown",
          avatar: p.authorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        },
        createdAt: new Date(p.createdAt).toLocaleDateString(),
        additions: 120,
        deletions: 35,
        checksStatus: "passing" as const,
        issue: p.issue,
        reviewers: [],
      }))
    : MOCK_PRS;

  const filtered = activePRs.filter(
    (pr: any) =>
      pr.title.toLowerCase().includes(search.toLowerCase()) ||
      pr.id.toLowerCase().includes(search.toLowerCase()) ||
      pr.branch.toLowerCase().includes(search.toLowerCase())
  );


  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto text-[#dae2fd]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#222a3d]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-geist text-3xl font-bold tracking-tight text-[#dae2fd]">
              Pull Requests
            </h2>
            {connectedRepo && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                Synced with {connectedRepo.name}
              </span>
            )}
          </div>
          <p className="text-[#c2c6d6] text-sm">
            Automated code analysis, reviewer approvals, &amp; CI/CD status for linked GitHub repositories
          </p>
        </div>

        <div className="flex items-center gap-2">
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                loadRepo(e.target.value);
              }}
              className="bg-[#171f33] text-[#dae2fd] border border-[#2d3449] font-geist text-xs font-semibold px-3 py-2 rounded-lg outline-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.key})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleSync}
            disabled={syncing || !connectedRepo}
            className="bg-[#171f33] text-[#adc6ff] hover:bg-[#222a3d] border border-[#2d3449] font-mono text-xs font-bold uppercase px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Syncing..." : "Sync PRs"}</span>
          </button>
        </div>
      </div>

      {/* PR Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-[#424754]">
          <span className="text-xs text-[#c2c6d6] font-mono uppercase tracking-wider block mb-1">
            Open PRs
          </span>
          <span className="text-3xl font-bold font-geist text-[#dae2fd]">3</span>
          <span className="text-xs text-[#4cd7f6] block mt-1 font-mono">2 ready for review</span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-[#424754]">
          <span className="text-xs text-[#c2c6d6] font-mono uppercase tracking-wider block mb-1">
            Average Merge Time
          </span>
          <span className="text-3xl font-bold font-geist text-[#dae2fd]">2.4 hrs</span>
          <span className="text-xs text-[#4ade80] block mt-1 font-mono">35% faster with AI triage</span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-[#424754]">
          <span className="text-xs text-[#c2c6d6] font-mono uppercase tracking-wider block mb-1">
            CI Pass Rate
          </span>
          <span className="text-3xl font-bold font-geist text-[#dae2fd]">98.2%</span>
          <span className="text-xs text-[#4ade80] block mt-1 font-mono">24 builds green</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#8c909f] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter pull requests by title, branch, or PR ID..."
          className="w-full pl-9 pr-4 py-2 bg-[#171f33] border border-[#2d3449] focus:border-[#adc6ff] rounded-lg text-xs text-[#dae2fd] placeholder:text-[#8c909f] outline-none font-geist transition-colors"
        />
      </div>

      {/* PR Table List */}
      <div className="glass-panel rounded-xl overflow-hidden border border-[#424754]">
        <div className="p-4 border-b border-[#424754] bg-[#131b2e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-geist text-sm font-semibold text-[#dae2fd]">
              Active Pull Requests
            </span>
            <span className="bg-[#171f33] text-[#adc6ff] px-2 py-0.5 rounded text-xs font-mono">
              {filtered.length} Total
            </span>
          </div>
        </div>

        <div className="divide-y divide-[#424754]/40">
          {filtered.map((pr: any) => (
            <div
              key={pr.id}
              className="p-4 hover:bg-[#171f33]/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-8 h-8 rounded bg-[#171f33] border border-[#424754] flex items-center justify-center text-[#adc6ff] shrink-0 mt-0.5">
                  <GitPullRequest className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-[#adc6ff]">
                      {pr.id}
                    </span>
                    <h3
                      onClick={() => window.open(pr.url || "https://github.com", "_blank")}
                      className="font-geist text-sm font-semibold text-[#dae2fd] hover:text-[#adc6ff] cursor-pointer truncate"
                    >
                      {pr.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#c2c6d6] mt-1 font-geist flex-wrap">
                    <span className="font-mono text-[#8c909f]">
                      {pr.branch} &rarr; main
                    </span>
                    <span>&bull;</span>
                    <span>Opened {pr.createdAt} by {pr.author?.name || "Unknown"}</span>
                    <span>&bull;</span>
                    <span className="font-mono text-[#4ade80]">+{pr.additions}</span>
                    <span className="font-mono text-[#ffb4ab]">-{pr.deletions}</span>
                  </div>
                </div>
              </div>

              {/* Status & Reviewers */}
              <div className="flex items-center gap-4 shrink-0 self-end md:self-center">
                {/* CI Check Status */}
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  {pr.checksStatus === 'passing' ? (
                    <span className="flex items-center gap-1 text-[#4ade80] bg-[#4ade80]/10 px-2 py-0.5 rounded border border-[#4ade80]/20">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Checks passed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[#facc15] bg-[#facc15]/10 px-2 py-0.5 rounded border border-[#facc15]/20">
                      <Clock className="w-3.5 h-3.5 animate-spin" /> In progress
                    </span>
                  )}
                </div>

                {/* Reviewers Avatars */}
                <div className="flex -space-x-1.5">
                  {(pr.reviewers || []).map((rev: any) => (
                    <div
                      key={rev.id || rev.name}
                      title={`Reviewer: ${rev.name}`}
                      className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-[10px] font-bold text-white border border-[#0b1326]"
                    >
                      {rev.name[0]}
                    </div>
                  ))}
                </div>

                <a
                  href={pr.url || "https://github.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded text-[#c2c6d6] hover:text-[#adc6ff] hover:bg-[#222a3d] transition-colors cursor-pointer"
                  title="Open GitHub PR"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
