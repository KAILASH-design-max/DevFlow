"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  type Permission,
  hasPermission,
  hasAnyRole,
  canUserPerform,
  getRoleBadgeConfig,
} from "@/lib/permissions";
import { ROLES, type Role } from "@devflow/shared";

export function usePermissions() {
  const { user, loading } = useAuth();

  const role = useMemo(() => {
    return (user?.role || "DEVELOPER").toUpperCase().trim() as Role;
  }, [user?.role]);

  const permissions = useMemo(() => {
    const can = (permission: Permission) => hasPermission(role, permission);
    const isRole = (...roles: ((Role | string) | (Role | string)[])[]) => {
      const flattened = roles.flat();
      return hasAnyRole(role, flattened);
    };

    return {
      user,
      role,
      loading,
      can,
      hasRole: isRole,

      // Specific capabilities
      canCreateIssue: can("ISSUE_CREATE"),
      canEditIssue: can("ISSUE_EDIT"),
      canMoveIssues: can("ISSUE_MOVE"),
      canDeleteIssue: can("ISSUE_DELETE"),

      canCreateProject: can("PROJECT_CREATE"),
      canUpdateProject: can("PROJECT_UPDATE"),
      canDeleteProject: can("PROJECT_DELETE"),

      canManageSprints: can("SPRINT_CREATE"),
      canInviteMembers: can("WORKSPACE_INVITE"),
      canManageMemberRoles: can("MEMBER_ROLE_UPDATE"),
      canManageWorkspace: can("WORKSPACE_MANAGE"),
      canManageBilling: can("WORKSPACE_BILLING"),
      canUploadAttachments: can("ATTACHMENT_UPLOAD"),
      canTriggerDeployments: can("DEPLOYMENT_TRIGGER"),

      // Role flags
      isAdmin: role === ROLES.ADMIN,
      isProjectManager: role === ROLES.PROJECT_MANAGER,
      isDeveloper: role === ROLES.DEVELOPER,
      isTester: role === ROLES.TESTER,
      isViewer: role === ROLES.VIEWER,

      // UI helpers
      badgeConfig: getRoleBadgeConfig(role),
    };
  }, [user, role, loading]);

  return permissions;
}
