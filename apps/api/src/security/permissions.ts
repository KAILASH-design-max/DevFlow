export type Role = "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER" | "TESTER" | "VIEWER";

export const RoleHierarchy: Record<Role, number> = {
  ADMIN: 100,
  PROJECT_MANAGER: 80,
  DEVELOPER: 60,
  TESTER: 40,
  VIEWER: 20,
};

export const Permissions = {
  WORKSPACE_MANAGE: ["ADMIN"],
  WORKSPACE_INVITE: ["ADMIN"],
  WORKSPACE_DELETE: ["ADMIN"],
  PROJECT_CREATE: ["ADMIN", "PROJECT_MANAGER"],
  PROJECT_UPDATE: ["ADMIN", "PROJECT_MANAGER"],
  PROJECT_DELETE: ["ADMIN"],
  SPRINT_MANAGE: ["ADMIN", "PROJECT_MANAGER"],
  ISSUE_CREATE: ["ADMIN", "PROJECT_MANAGER", "DEVELOPER", "TESTER"],
  ISSUE_UPDATE: ["ADMIN", "PROJECT_MANAGER", "DEVELOPER", "TESTER"],
  ISSUE_DELETE: ["ADMIN", "PROJECT_MANAGER"],
  COMMENT_CREATE: ["ADMIN", "PROJECT_MANAGER", "DEVELOPER", "TESTER", "VIEWER"],
  COMMENT_DELETE: ["ADMIN", "PROJECT_MANAGER"],
  ATTACHMENT_UPLOAD: ["ADMIN", "PROJECT_MANAGER", "DEVELOPER", "TESTER"],
  ATTACHMENT_DELETE: ["ADMIN"],
} as const;

export function hasMinimumRole(userRole: string, requiredRole: Role): boolean {
  const userLevel = RoleHierarchy[userRole as Role] || 0;
  const requiredLevel = RoleHierarchy[requiredRole] || 0;
  return userLevel >= requiredLevel;
}
