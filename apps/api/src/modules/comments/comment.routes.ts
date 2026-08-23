import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "@devflow/database";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createCommentSchema } from "@devflow/shared";

export const commentRouter = Router();

commentRouter.use(authenticate);

// ─── Create Comment ─────────────────────────────
commentRouter.post(
  "/",
  validate(createCommentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { content } = req.body;
      const issueId = req.query.issueId as string;

      if (!issueId) {
        res.status(400).json({ success: false, error: "issueId query parameter is required" });
        return;
      }

      const comment = await prisma.comment.create({
        data: {
          content,
          issueId,
          authorId: req.user!.userId,
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
          entityId: issueId,
          userId: req.user!.userId,
          metadata: JSON.stringify({ commentId: comment.id }),
        },
      });

      res.status(201).json({ success: true, data: comment });
    } catch (error) {
      next(error);
    }
  }
);

// ─── List Comments for Issue ────────────────────
commentRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const issueId = req.query.issueId as string;

      if (!issueId) {
        res.status(400).json({ success: false, error: "issueId query parameter is required" });
        return;
      }

      const comments = await prisma.comment.findMany({
        where: { issueId },
        include: {
          author: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      res.json({ success: true, data: comments });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Delete Comment ─────────────────────────────
commentRouter.delete(
  "/:commentId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const comment = await prisma.comment.findUnique({
        where: { id: req.params.commentId as string },
      });

      if (!comment) {
        res.status(404).json({ success: false, error: "Comment not found" });
        return;
      }

      if (comment.authorId !== req.user!.userId) {
        res.status(403).json({ success: false, error: "Not authorized to delete this comment" });
        return;
      }

      await prisma.comment.delete({
        where: { id: req.params.commentId as string },
      });

      res.json({ success: true, message: "Comment deleted" });
    } catch (error) {
      next(error);
    }
  }
);
