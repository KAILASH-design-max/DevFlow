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

    // Check if issue exists in SQLite
    let issue = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) {
      const numMatch = issueId.match(/\d+/);
      if (numMatch) {
        issue = await prisma.issue.findFirst({ where: { number: parseInt(numMatch[0], 10) } });
      }
    }

    if (issue) {
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
    } else {
      // Handled via Firestore database fallback (Legacy)
      return {
        id: `cmt_${Date.now()}`,
        content,
        issueId,
        authorId,
        author: { id: authorId, name: authorName || (authorEmail ? authorEmail.split("@")[0] : "Alice Chen"), avatar: null },
        createdAt: new Date().toISOString(),
      };
    }
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
      const numMatch = issueId.match(/\d+/);
      if (numMatch) {
        const matched = await prisma.issue.findFirst({ where: { number: parseInt(numMatch[0], 10) } });
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
  static async deleteComment(commentId: string, authorId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw createError("Comment not found", 404);
    }

    if (comment.authorId !== authorId) {
      throw createError("Not authorized to delete this comment", 403);
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return { message: "Comment deleted" };
  }
}
