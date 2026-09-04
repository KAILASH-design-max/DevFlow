"use client";

import React from "react";
import { usePermissions } from "@/hooks/usePermissions";
import type { Permission } from "@/lib/permissions";
import type { Role } from "@devflow/shared";

interface PermissionGateProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  renderDisabled?: boolean;
  disabledTooltip?: string;
}

/**
 * Declarative component to conditionally render children based on user permissions.
 */
export function PermissionGate({
  permission,
  children,
  fallback = null,
  renderDisabled = false,
  disabledTooltip,
}: PermissionGateProps) {
  const { can, role } = usePermissions();
  const hasAccess = can(permission);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (renderDisabled && React.isValidElement(children)) {
    const tooltip = disabledTooltip || `Action restricted for role: ${role}`;
    return React.cloneElement(children as React.ReactElement<any>, {
      disabled: true,
      "aria-disabled": "true",
      title: tooltip,
      className: `${(children as any).props?.className || ""} opacity-50 cursor-not-allowed pointer-events-none`,
    });
  }

  return <>{fallback}</>;
}

interface RoleGateProps {
  allowedRoles: (Role | string)[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  renderDisabled?: boolean;
  disabledTooltip?: string;
}

/**
 * Declarative component to conditionally render children based on user roles.
 */
export function RoleGate({
  allowedRoles,
  children,
  fallback = null,
  renderDisabled = false,
  disabledTooltip,
}: RoleGateProps) {
  const { hasRole, role } = usePermissions();
  const hasAccess = hasRole(allowedRoles);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (renderDisabled && React.isValidElement(children)) {
    const tooltip = disabledTooltip || `Action restricted for role: ${role}`;
    return React.cloneElement(children as React.ReactElement<any>, {
      disabled: true,
      "aria-disabled": "true",
      title: tooltip,
      className: `${(children as any).props?.className || ""} opacity-50 cursor-not-allowed pointer-events-none`,
    });
  }

  return <>{fallback}</>;
}
