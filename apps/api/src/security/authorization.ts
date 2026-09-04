import { Request, Response, NextFunction } from "express";
import { prisma } from "@devflow/database";
import { createError } from "../middleware/errorHandler.js";
import { SecurityEventLogger } from "./security-events.js";
import { Role, hasMinimumRole } from "./permissions.js";

/**
 * Verify that a user is a member of a workspace.
 */
export async function verifyWorkspaceMembership(
  userId: string,
  workspaceId: string,
  allowedRoles?: string[]
) {
  if (!workspaceId) {
    throw createError("Workspace ID is required", 400);
  }

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (!member) {
    await SecurityEventLogger.log({
      userId,
      workspaceId,
      eventType: "IDOR_ATTEMPT",
      metadata: { action: "WORKSPACE_MEMBERSHIP_CHECK_FAILED" },
    });
    throw createError("Not a member of this workspace", 403);
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(member.role)) {
    throw createError(
      `Insufficient permissions. Required role: ${allowedRoles.join(", ")}`,
      403
    );
  }

  return member;
}

/**
 * Verify that a user has access to a project by checking its workspace membership.
 */
export async function verifyProjectAccess(
  userId: string,
  projectId: string,
  allowedRoles?: string[]
) {
  if (!projectId) {
    throw createError("Project ID is required", 400);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, workspaceId: true },
  });

  if (!project) {
    throw createError("Project not found", 404);
  }

  const member = await verifyWorkspaceMembership(userId, project.workspaceId, allowedRoles);

  return { project, member };
}

/**
 * Verify that a user has access to an issue.
 */
export async function verifyIssueAccess(
  userId: string,
  issueId: string,
  allowedRoles?: string[]
) {
  if (!issueId) {
    throw createError("Issue ID is required", 400);
  }

  let issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { id: true, projectId: true, reporterId: true },
  });

  if (!issue && issueId.includes("-")) {
    const lastDashIdx = issueId.lastIndexOf("-");
    const projectKey = issueId.substring(0, lastDashIdx);
    const numStr = issueId.substring(lastDashIdx + 1);
    const num = parseInt(numStr, 10);
    if (projectKey && !isNaN(num)) {
      const project = await prisma.project.findFirst({
        where: { key: { equals: projectKey, mode: "insensitive" } },
        select: { id: true },
      });
      if (project) {
        issue = await prisma.issue.findFirst({
          where: {
            projectId: project.id,
            number: num,
          },
          select: { id: true, projectId: true, reporterId: true },
        });
      }
    }
  }

  if (!issue) {
    const numMatch = issueId.match(/\d+/);
    if (numMatch) {
      const num = parseInt(numMatch[0], 10);
      issue = await prisma.issue.findFirst({
        where: { number: num },
        select: { id: true, projectId: true, reporterId: true },
      });
    }
  }

  if (!issue) {
    throw createError("Issue not found", 404);
  }

  const { project, member } = await verifyProjectAccess(userId, issue.projectId, allowedRoles);

  return { issue, project, member };
}

/**
 * Verify sprint access
 */
export async function verifySprintAccess(
  userId: string,
  sprintId: string,
  allowedRoles?: string[]
) {
  if (!sprintId) {
    throw createError("Sprint ID is required", 400);
  }

  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    select: { id: true, projectId: true },
  });

  if (!sprint) {
    throw createError("Sprint not found", 404);
  }

  const { project, member } = await verifyProjectAccess(userId, sprint.projectId, allowedRoles);

  return { sprint, project, member };
}

/**
 * Verify attachment access
 */
export async function verifyAttachmentAccess(
  userId: string,
  attachmentId: string,
  allowedRoles?: string[]
) {
  if (!attachmentId) {
    throw createError("Attachment ID is required", 400);
  }

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    select: { id: true, issueId: true, uploaderId: true, filename: true },
  });

  if (!attachment) {
    throw createError("Attachment not found", 404);
  }

  const { issue, project, member } = await verifyIssueAccess(userId, attachment.issueId, allowedRoles);

  return { attachment, issue, project, member };
}

/**
 * Verify comment access
 */
export async function verifyCommentAccess(
  userId: string,
  commentId: string,
  allowedRoles?: string[]
) {
  if (!commentId) {
    throw createError("Comment ID is required", 400);
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, issueId: true, authorId: true },
  });

  if (!comment) {
    throw createError("Comment not found", 404);
  }

  const { issue, project, member } = await verifyIssueAccess(userId, comment.issueId, allowedRoles);

  return { comment, issue, project, member };
}

/**
 * Express middleware helper to enforce workspace membership
 */
export function requireWorkspaceRole(requiredRole: Role) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const workspaceId = req.params.workspaceId || req.body.workspaceId || (req.query.workspaceId as string);

      if (!userId) {
        return next(createError("Authentication required", 401));
      }
      if (!workspaceId) {
        return next(createError("Workspace ID required", 400));
      }

      const member = await verifyWorkspaceMembership(userId, workspaceId);
      if (!hasMinimumRole(member.role, requiredRole)) {
        return next(createError(`Requires minimum role: ${requiredRole}`, 403));
      }

      (req as any).workspaceMember = member;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Verify that a notification belongs to the requesting user.
 */
export async function verifyNotificationOwnership(
  userId: string,
  notificationId: string
) {
  if (!notificationId) {
    throw createError("Notification ID is required", 400);
  }

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw createError("Notification not found", 404);
  }

  if (notification.userId !== userId) {
    throw createError("Not authorized to access this notification", 403);
  }

  return notification;
}

/**
 * Verify that a user has access to a label by resolving label → project → workspace.
 */
export async function verifyLabelAccess(
  userId: string,
  labelId: string,
  allowedRoles?: string[]
) {
  if (!labelId) {
    throw createError("Label ID is required", 400);
  }

  const label = await prisma.label.findUnique({
    where: { id: labelId },
    select: { id: true, projectId: true },
  });

  if (!label) {
    throw createError("Label not found", 404);
  }

  const { project, member } = await verifyProjectAccess(userId, label.projectId, allowedRoles);

  return { label, project, member };
}
