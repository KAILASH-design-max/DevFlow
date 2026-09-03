import { prisma } from "@devflow/database";
import { createError } from "./errorHandler.js";

/**
 * Verify that a user is a member of a workspace.
 * Optionally restrict to specific roles.
 * Returns the membership record.
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
 * Verify that a user is a member of a project's workspace.
 * Looks up the project, resolves its workspaceId, then checks membership.
 * Optionally restrict to specific workspace roles.
 * Returns { project, member }.
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
 * Verify that a user has access to an issue by resolving issue → project → workspace.
 * Returns { issue, project, member }.
 */
export async function verifyIssueAccess(
  userId: string,
  issueId: string,
  allowedRoles?: string[]
) {
  if (!issueId) {
    throw createError("Issue ID is required", 400);
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { id: true, projectId: true },
  });

  if (!issue) {
    throw createError("Issue not found", 404);
  }

  const { project, member } = await verifyProjectAccess(userId, issue.projectId, allowedRoles);

  return { issue, project, member };
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
 * Verify that a user has access to a sprint by resolving sprint → project → workspace.
 * Returns { sprint, project, member }.
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
 * Verify that a user has access to a comment by resolving comment → issue → project → workspace.
 * Returns { comment, issue, project, member }.
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
 * Verify that a user has access to an attachment by resolving attachment → issue → project → workspace.
 * Returns { attachment, issue, project, member }.
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
 * Verify that a user has access to a label by resolving label → project → workspace.
 * Returns { label, project, member }.
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

