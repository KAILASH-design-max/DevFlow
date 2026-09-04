import { ROLES, type Role } from "@devflow/shared";
import type { UserProfile } from "@/context/AuthContext";

export type Permission =
  // Workspace Administration
  | "WORKSPACE_MANAGE"
  | "WORKSPACE_BILLING"
  | "WORKSPACE_INVITE"
  | "MEMBER_ROLE_UPDATE"
  | "MEMBER_REMOVE"
  // Projects & Repositories
  | "PROJECT_CREATE"
  | "PROJECT_UPDATE"
  | "PROJECT_DELETE"
  | "GITHUB_INTEGRATION"
  // Sprints & Agile
  | "SPRINT_CREATE"
  | "SPRINT_UPDATE"
  | "SPRINT_DELETE"
  // Issues & Tasks
  | "ISSUE_CREATE"
  | "ISSUE_EDIT"
  | "ISSUE_MOVE"
  | "ISSUE_DELETE"
  // Social & Collaboration
  | "COMMENT_CREATE"
  | "COMMENT_DELETE"
  | "ATTACHMENT_UPLOAD"
  | "ATTACHMENT_DELETE"
  // Deployments & CI/CD
  | "DEPLOYMENT_TRIGGER";

/**
 * Mapping of permissions to roles allowed to perform them.
 * Aligned with backend RBAC security and @devflow/shared matrix.
 */
export const ROLE_PERMISSIONS: Record<Permission, Role[]> = {
  // Workspace Administration
  WORKSPACE_MANAGE: [ROLES.ADMIN],
  WORKSPACE_BILLING: [ROLES.ADMIN],
  WORKSPACE_INVITE: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  MEMBER_ROLE_UPDATE: [ROLES.ADMIN],
  MEMBER_REMOVE: [ROLES.ADMIN],

  // Projects & Repositories
  PROJECT_CREATE: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  PROJECT_UPDATE: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  PROJECT_DELETE: [ROLES.ADMIN],
  GITHUB_INTEGRATION: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.DEVELOPER],

  // Sprints & Agile
  SPRINT_CREATE: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  SPRINT_UPDATE: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  SPRINT_DELETE: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],

  // Issues & Tasks
  ISSUE_CREATE: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.DEVELOPER, ROLES.TESTER],
  ISSUE_EDIT: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.DEVELOPER, ROLES.TESTER],
  ISSUE_MOVE: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.DEVELOPER, ROLES.TESTER],
  ISSUE_DELETE: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],

  // Social & Collaboration
  COMMENT_CREATE: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.DEVELOPER, ROLES.TESTER, ROLES.VIEWER],
  COMMENT_DELETE: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  ATTACHMENT_UPLOAD: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.DEVELOPER, ROLES.TESTER],
  ATTACHMENT_DELETE: [ROLES.ADMIN],

  // Deployments & CI/CD
  DEPLOYMENT_TRIGGER: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.DEVELOPER],
};

/**
 * Check if a given role has a specific permission
 */
export function hasPermission(
  role: string | null | undefined,
  permission: Permission
): boolean {
  if (!role) return false;
  const normalizedRole = role.toUpperCase().trim() as Role;
  const allowedRoles = ROLE_PERMISSIONS[permission];
  return allowedRoles ? allowedRoles.includes(normalizedRole) : false;
}

/**
 * Check if a given role is in the list of allowed roles
 */
export function hasAnyRole(
  role: string | null | undefined,
  allowedRoles: (Role | string)[]
): boolean {
  if (!role) return false;
  const normalizedRole = role.toUpperCase().trim();
  return allowedRoles.some((r) => r.toUpperCase() === normalizedRole);
}

/**
 * Check if a UserProfile has permission to perform an action
 */
export function canUserPerform(
  user: UserProfile | null | undefined,
  permission: Permission
): boolean {
  if (!user || !user.role) return false;
  return hasPermission(user.role, permission);
}

/**
 * Get display metadata for a user role
 */
export function getRoleBadgeConfig(role: string | null | undefined): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  const normalized = (role || "").toUpperCase().trim();
  switch (normalized) {
    case "ADMIN":
      return {
        label: "Admin",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
        dotClass: "bg-amber-500",
      };
    case "PROJECT_MANAGER":
      return {
        label: "Project Manager",
        badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
        dotClass: "bg-purple-500",
      };
    case "DEVELOPER":
      return {
        label: "Developer",
        badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
        dotClass: "bg-indigo-500",
      };
    case "TESTER":
      return {
        label: "QA / Tester",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dotClass: "bg-emerald-500",
      };
    case "VIEWER":
      return {
        label: "Viewer (Read-Only)",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
        dotClass: "bg-slate-400",
      };
    default:
      return {
        label: role || "Member",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
        dotClass: "bg-slate-400",
      };
  }
}
