import { prisma } from "@devflow/database";
import { createError } from "../../middleware/errorHandler.js";

export class CommentService {
  /**
   * Create a new comment on an issue
   */
  static async createComment(data: { content: string; issueId: string; authorId: string; authorName?: string; authorEmail?: string }) {
    const { content, issueId, authorId, authorName, authorEmail } = data;

    if (!issueId) {
      throw createError("issueId is required", 400);
    }

    // Check if issue exists in database (by ID or scoped ProjectKey-Number e.g. DF-101)
    let issue = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) {
      const parts = issueId.split("-");
      if (parts.length >= 2 && !isNaN(Number(parts[parts.length - 1]))) {
        const projectKey = parts.slice(0, parts.length - 1).join("-").toUpperCase();
        const number = parseInt(parts[parts.length - 1], 10);
        issue = await prisma.issue.findFirst({
          where: {
            number,
            project: { key: projectKey },
          },
        });
      }
    }

    if (!issue) {
      throw createError("Issue not found", 404);
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        issueId: issue.id,
        authorId,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "COMMENTED",
        entityType: "ISSUE",
        entityId: issue.id,
        userId: authorId,
        metadata: JSON.stringify({ commentId: comment.id }),
      },
    }).catch(() => {});

    return comment;
  }

  /**
   * List Comments for Issue
   */
  static async listComments(issueId: string) {
    if (!issueId) {
      throw createError("issueId is required", 400);
    }

    let targetIssueId = issueId;
    const issue = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) {
      const parts = issueId.split("-");
      if (parts.length >= 2 && !isNaN(Number(parts[parts.length - 1]))) {
        const projectKey = parts.slice(0, parts.length - 1).join("-").toUpperCase();
        const number = parseInt(parts[parts.length - 1], 10);
        const matched = await prisma.issue.findFirst({
          where: {
            number,
            project: { key: projectKey },
          },
        });
        if (matched) targetIssueId = matched.id;
      }
    }

    const comments = await prisma.comment.findMany({
      where: { issueId: targetIssueId },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return comments;
  }

  /**
   * Delete Comment
   */
  static async deleteComment(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        issue: {
          include: {
            project: {
              select: { workspaceId: true },
            },
          },
        },
      },
    });

    if (!comment) {
      throw createError("Comment not found", 404);
    }

    if (comment.authorId !== userId) {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: comment.issue.project.workspaceId,
          },
        },
      });

      if (!member || (member.role !== "ADMIN" && member.role !== "OWNER")) {
        throw createError("Not authorized to delete this comment", 403);
      }
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return { message: "Comment deleted" };
  }
}
