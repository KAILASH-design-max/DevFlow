"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Mail,
  MoreVertical,
  Check,
  Copy,
  ExternalLink,
  Crown,
  KeyRound,
  Trash2,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react";
import { workspaceApi } from "@/lib/api";
import { RBAC_ROLE_PERMISSIONS_MATRIX } from "@devflow/shared";
import { usePermissions } from "@/hooks/usePermissions";

export default function TeamPage() {
  const { canInviteMembers, canManageMemberRoles, role: currentUserRole } = usePermissions();

  const [workspace, setWorkspace] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("DEVELOPER");
  const [inviting, setInviting] = useState(false);

  const [isRbacModalOpen, setIsRbacModalOpen] = useState(false);

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      setError("");
      let currentMembers: any[] = [];
      let currentWs: any = null;

      // 1. Fetch from Workspace API
      const res = await workspaceApi.list().catch(() => null);
      let ws = res?.data?.[0];
      if (ws) {
        currentWs = ws;
        if (ws.members && ws.members.length > 0) {
          currentMembers = ws.members;
        } else {
          const detailRes = await workspaceApi.get(ws.id).catch(() => null);
          if (detailRes?.success && detailRes.data?.members?.length) {
            currentWs = detailRes.data;
            currentMembers = detailRes.data.members;
          }
        }
      }



      if (currentWs) {
        setWorkspace(currentWs);
        setMembers(currentMembers);

        const invRes = await workspaceApi.getInvites(currentWs.id).catch(() => null);
        if (invRes?.success && invRes.data) {
          setInvites(invRes.data);
        }
      }
    } catch (err: any) {
      console.warn("Error loading team members:", err);
      setWorkspace(null);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!workspace) return;
    try {
      setError("");
      setSuccess("");
      const res = await workspaceApi.updateRole(workspace.id, memberId, newRole);
      if (res.success) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
        );
        setSuccess("Member role updated successfully.");
      } else {
        throw new Error(res.error || "Failed to update role");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update role");
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!workspace) return;
    if (!confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) return;

    try {
      setError("");
      setSuccess("");
      const res = await workspaceApi.removeMember(workspace.id, memberId);
      if (res.success) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        setSuccess("Member removed from workspace.");
      } else {
        throw new Error(res.error || "Failed to remove member");
      }
    } catch (err: any) {
      setError(err.message || "Failed to remove member");
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;

    try {
      setInviting(true);
      setError("");
      setSuccess("");
      const res = await workspaceApi.invite(workspace.id, inviteEmail, inviteRole);
      if (res.success) {
        setSuccess(`Invitation email dispatched via Gmail SMTP to ${inviteEmail}!`);
        setIsInviteModalOpen(false);
        setInviteEmail("");
        setInviteRole("DEVELOPER");
        loadTeamData();
      } else {
        throw new Error(res.error || "Failed to send invitation");
      }
    } catch (err: any) {
      setError(err.message || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!workspace) return;
    try {
      const res = await workspaceApi.revokeInvite(workspace.id, inviteId);
      if (res.success) {
        setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
        setSuccess("Invitation revoked.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to revoke invitation");
    }
  };

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const name = m.user?.name || "";
    const email = m.user?.email || "";
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto text-slate-900 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600" />
            Team &amp; Granular RBAC Permissions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization members, assign 5-tier roles, and configure access boundaries
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setIsRbacModalOpen(true)}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>RBAC Matrix</span>
          </button>

          {canInviteMembers ? (
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Member</span>
            </button>
          ) : (
            <div
              className="px-3 py-2 bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-not-allowed"
              title="Only Admins and Project Managers can invite members"
            >
              <span>Invite Restricted ({currentUserRole})</span>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium animate-fade-in">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Search & Active Members Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Active Team Members ({members.length})
            </h3>
            <p className="text-xs text-slate-500">
              Engineers and contributors currently active in this workspace
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading team members...</div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-xs font-bold text-white shadow-2xs shrink-0">
                          {m.user?.name ? m.user.name[0].toUpperCase() : "U"}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <span>{m.user?.name || "Collaborator"}</span>
                            {m.role === "ADMIN" && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                          </div>
                          {(m.user?.title || (m.userId === "usr_alice" ? "Lead Architect (Admin)" : m.userId === "usr_bob" ? "Senior Full-Stack Engineer" : m.userId === "usr_carol" ? "Technical Product Manager" : "QA Automation Engineer")) && (
                            <div className="text-[11px] text-slate-500 font-medium">
                              {m.user?.title || (m.userId === "usr_alice" ? "Lead Architect (Admin)" : m.userId === "usr_bob" ? "Senior Full-Stack Engineer" : m.userId === "usr_carol" ? "Technical Product Manager" : "QA Automation Engineer")}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] font-mono font-semibold bg-slate-100 text-indigo-700 px-1.5 py-0.2 rounded border border-slate-200">
                              {m.user?.id || m.userId}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              • Member: {m.id}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {m.user?.email}
                    </td>

                    <td className="py-3.5 px-4">
                      {canManageMemberRoles ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id, e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="ADMIN">Admin (Full Access)</option>
                          <option value="PROJECT_MANAGER">Project Manager</option>
                          <option value="DEVELOPER">Developer (Code &amp; Issues)</option>
                          <option value="TESTER">QA / Tester</option>
                          <option value="VIEWER">Viewer (Read-Only)</option>
                        </select>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {m.role}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {canManageMemberRoles ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.id, m.user?.name || m.user?.email)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove Member (Admin only)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {invites.length > 0 && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Pending Invitations ({invites.length})
            </h3>
            <p className="text-xs text-slate-500">
              Invitations sent by email awaiting registration confirmation
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
            {invites.map((inv) => (
              <div key={inv.id} className="p-4 flex items-center justify-between gap-3 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-xs font-bold">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{inv.email}</span>
                    <span className="text-[10px] text-slate-400 block">Invited as {inv.role}</span>
                  </div>
                </div>

                {canManageMemberRoles && (
                  <button
                    type="button"
                    onClick={() => handleRevokeInvite(inv.id)}
                    className="px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Invite Member Modal ─── */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Invite Team Member</h3>
                <p className="text-xs text-slate-500">Send an invitation to join this workspace.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-900 outline-none cursor-pointer"
                >
                  <option value="ADMIN">Admin (Full Access)</option>
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="DEVELOPER">Developer (Code &amp; Issues)</option>
                  <option value="TESTER">QA / Tester</option>
                  <option value="VIEWER">Viewer (Read-Only)</option>
                </select>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs text-indigo-800">
                <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>An invitation email with workspace access instructions will be dispatched via Gmail SMTP.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {inviting ? "Sending Invitation..." : "Send Invitation Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Granular RBAC Permissions Matrix Modal ─── */}
      {isRbacModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Granular RBAC Permissions Matrix
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comprehensive capability matrix across all 5 standard DevFlow organization roles
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRbacModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Matrix Table */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-3 px-4">Capability / Action</th>
                      <th className="py-3 px-2 text-center w-24">Admin</th>
                      <th className="py-3 px-2 text-center w-24">PM</th>
                      <th className="py-3 px-2 text-center w-24">Developer</th>
                      <th className="py-3 px-2 text-center w-24">Tester</th>
                      <th className="py-3 px-2 text-center w-24">Viewer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {RBAC_ROLE_PERMISSIONS_MATRIX.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                            {row.category}
                          </span>
                          <span className="font-semibold text-slate-900 block mt-0.5">
                            {row.action}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {row.description}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          {row.admin ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">
                              ✓
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {row.projectManager ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">
                              ✓
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {row.developer ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">
                              ✓
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {row.tester ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">
                              ✓
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {row.viewer ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">
                              ✓
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 flex justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsRbacModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Close Matrix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
