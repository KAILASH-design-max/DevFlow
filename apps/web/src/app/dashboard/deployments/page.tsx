"use client";

import { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw, 
  GitCommit
} from 'lucide-react';

const INITIAL_DEPLOYMENTS = [
  {
    id: 'DEP-104',
    environment: 'production' as const,
    status: 'success' as const,
    version: 'v2.14.2',
    commitSha: '8a3f9e2',
    deployedAt: '1 day ago',
    url: 'https://devflow.io'
  },
  {
    id: 'DEP-103',
    environment: 'staging' as const,
    status: 'success' as const,
    version: 'v2.14.3-rc1',
    commitSha: '4b7c1a0',
    deployedAt: '2 hours ago',
    url: 'https://staging.devflow.io'
  },
  {
    id: 'DEP-102',
    environment: 'preview' as const,
    status: 'success' as const,
    version: 'pr-442-auth-fix',
    commitSha: '9e1f2b4',
    deployedAt: '10 mins ago',
    url: 'https://pr-442.preview.devflow.io'
  },
];

export default function DeploymentsPage() {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentsList, setDeploymentsList] = useState(INITIAL_DEPLOYMENTS);

  const handleTriggerDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      const newDep = {
        id: `DEP-${Math.floor(100 + Math.random() * 900)}`,
        environment: 'staging' as const,
        status: 'success' as const,
        version: 'v2.14.3-alpha',
        commitSha: Math.random().toString(16).substring(2, 9),
        deployedAt: 'Just now',
        url: 'https://staging.devflow.io'
      };
      setDeploymentsList([newDep, ...deploymentsList]);
      setIsDeploying(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Deployments &amp; Releases
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Real-time pipeline statuses and cloud container environments
          </p>
        </div>
        <button
          onClick={handleTriggerDeploy}
          disabled={isDeploying}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isDeploying ? 'animate-spin' : ''}`} />
          <span>{isDeploying ? 'Deploying Container...' : 'Trigger Staging Deploy'}</span>
        </button>
      </div>

      {/* Environments Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Production */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs" />
              <h3 className="text-base font-bold text-slate-900">Production</h3>
            </div>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold uppercase">
              Operational
            </span>
          </div>
          <p className="text-xs text-slate-600 mb-1">
            Release: <span className="font-mono font-bold text-indigo-600">v2.14.2</span> (commit 8a3f9e2)
          </p>
          <p className="text-[11px] text-slate-400 mb-4">
            Deployed 1 day ago &bull; 0 error rate
          </p>
          <a
            href="https://devflow.io"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
          >
            https://devflow.io <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Staging */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-2xs" />
              <h3 className="text-base font-bold text-slate-900">Staging</h3>
            </div>
            <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-semibold uppercase">
              Ready for QA
            </span>
          </div>
          <p className="text-xs text-slate-600 mb-1">
            Release: <span className="font-mono font-bold text-indigo-600">v2.14.3-rc1</span> (commit 4b7c1a0)
          </p>
          <p className="text-[11px] text-slate-400 mb-4">
            Deployed 2 hours ago &bull; All tests passing
          </p>
          <a
            href="https://staging.devflow.io"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
          >
            https://staging.devflow.io <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Preview Environments */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h3 className="text-base font-bold text-slate-900">Ephemeral Previews</h3>
            </div>
            <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 font-semibold uppercase">
              3 Active
            </span>
          </div>
          <p className="text-xs text-slate-600 mb-1">
            Auto-spun per GitHub PR branch
          </p>
          <p className="text-[11px] text-slate-400 mb-4">
            PR #442, PR #440, PR #439
          </p>
          <span className="text-xs text-slate-500">
            Cloud Run auto-cleanup in 48h
          </span>
        </div>
      </div>

      {/* Deployment History Table */}
      <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-900">
            Recent Deployment Log
          </span>
          <span className="text-xs text-slate-500 font-medium">Auto-synced with Git</span>
        </div>

        <div className="divide-y divide-slate-100">
          {deploymentsList.map((dep) => (
            <div
              key={dep.id}
              className="p-4 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    dep.status === 'success'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-rose-50 text-rose-600 border border-rose-200'
                  }`}
                >
                  {dep.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {dep.version}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold uppercase ${
                        dep.environment === 'production'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : dep.environment === 'staging'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {dep.environment}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-mono">
                    <GitCommit className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dep.commitSha}</span>
                    <span>&bull;</span>
                    <span>{dep.deployedAt}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={dep.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 transition-colors flex items-center gap-1.5 font-medium"
                >
                  <span>Visit URL</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
