"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { workspaceApi } from "@/lib/api";
import {
  Building2,
  Users,
  FolderKanban,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  LogIn,
  UserPlus,
  Compass
} from "lucide-react";

interface WorkspaceInviteData {
  workspace: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    memberCount?: number;
    projectCount?: number;
  };
  role: string;
  token?: string | null;
  expired?: boolean;
  valid?: boolean;
}

function JoinWorkspaceContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const workspaceId = (params?.workspaceId as string) || searchParams.get("workspaceId") || "";
  const token = searchParams.get("token") || "";
  const roleParam = searchParams.get("role") || "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inviteData, setInviteData] = useState<WorkspaceInviteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);

  // Fetch workspace invitation details
  useEffect(() => {
    if (!workspaceId) {
      setError("No workspace identifier provided in the invitation link.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchInviteDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await workspaceApi.getInviteDetails(workspaceId, token || undefined, roleParam || undefined);
        if (isMounted) {
          if (res?.success && res?.data) {
            setInviteData(res.data);
          } else {
            setError(res?.message || "Workspace not found or invitation link is invalid.");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Failed to load invitation details. Please check your network.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInviteDetails();
    return () => {
      isMounted = false;
    };
  }, [workspaceId, token, roleParam]);

  const handleAcceptInvite = async () => {
    if (!workspaceId) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await workspaceApi.acceptInvite(workspaceId, token || undefined, roleParam || undefined);
      if (res?.success) {
        const joinedWorkspace = res.data?.workspace || inviteData?.workspace;
        if (joinedWorkspace?.id) {
          localStorage.setItem("devflow_active_workspace_id", joinedWorkspace.id);
        }
        if (res.data?.alreadyMember) {
          setAlreadyMember(true);
          setSuccess("You are already a member of this workspace!");
        } else {
          setSuccess("Welcome to the team! Redirecting to dashboard...");
        }

        setTimeout(() => {
          router.push("/dashboard");
        }, 1200);
      } else {
        setError(res?.message || "Failed to accept workspace invitation.");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred while accepting the invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-indigo-600/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-xl shadow-xl shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            DF
          </div>
          <span className="text-2xl font-extrabold text-white tracking-tight">DevFlow</span>
        </Link>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
          Workspace Invitation
        </p>
      </div>

      {/* Main Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-2xl py-8 px-6 shadow-2xl rounded-3xl border border-slate-800/80 sm:px-10">
          {loading || authLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
              <p className="text-sm text-slate-400 font-medium">Validating workspace invitation...</p>
            </div>
          ) : error && !inviteData ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Invalid or Expired Invitation</h3>
              <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">{error}</p>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all"
              >
                <Compass className="w-4 h-4" /> Return to DevFlow Home
              </Link>
            </div>
          ) : (
            <div>
              {/* Workspace Header Info */}
              <div className="text-center pb-6 border-b border-slate-800/80">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/10">
                  <Building2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {inviteData?.workspace?.name || "Workspace"}
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  devflow.io/{inviteData?.workspace?.slug || "workspace"}
                </p>
                {inviteData?.workspace?.description && (
                  <p className="text-sm text-slate-300 mt-3 max-w-md mx-auto line-clamp-2">
                    {inviteData.workspace.description}
                  </p>
                )}

                {/* Role Pill */}
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Invited Role: {inviteData?.role || roleParam || "DEVELOPER"}</span>
                </div>
              </div>

              {/* Stats Highlights */}
              <div className="grid grid-cols-2 gap-3 my-6">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Team Size</p>
                    <p className="text-sm font-bold text-white">
                      {inviteData?.workspace?.memberCount || 1} Member{inviteData?.workspace?.memberCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Active Projects</p>
                    <p className="text-sm font-bold text-white">
                      {inviteData?.workspace?.projectCount || 1} Project{inviteData?.workspace?.projectCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  <span>{success}</span>
                </div>
              )}

              {/* Action Buttons based on Auth State */}
              {user ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
                    <p className="text-xs text-slate-400">
                      Signed in as <span className="font-semibold text-white">{user.name || user.email}</span>
                    </p>
                  </div>

                  {alreadyMember ? (
                    <Link
                      href="/dashboard"
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-2xl text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      <span>Open Workspace Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleAcceptInvite}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-2xl text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Joining workspace...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Accept &amp; Join Workspace</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-center text-slate-400 mb-2">
                    Please sign in or create an account to accept this invitation.
                  </p>

                  <Link
                    href={`/login?redirect=${encodeURIComponent(currentPath)}`}
                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-2xl text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Accept</span>
                  </Link>

                  <Link
                    href={`/signup?redirect=${encodeURIComponent(currentPath)}`}
                    className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-2xl text-sm border border-slate-700/60 transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Create Free Account</span>
                  </Link>
                </div>
              )}

              {/* Footer */}
              <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
                <p className="text-xs text-slate-500">
                  Protected by DevFlow Enterprise RBAC &amp; Tenant Isolation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JoinWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <JoinWorkspaceContent />
    </Suspense>
  );
}
