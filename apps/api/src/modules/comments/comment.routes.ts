import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createCommentSchema } from "@devflow/shared";
import { CommentService } from "./comment.service.js";
import { verifyIssueAccess } from "../../middleware/authorizationHelpers.js";

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
      const authorId = req.user!.userId;
      const authorName = (req.user as any)?.name || undefined;
      const authorEmail = req.user!.email || undefined;

      await verifyIssueAccess(authorId, issueId);

      const comment = await CommentService.createComment({
        content,
        issueId,
        authorId,
        authorName,
        authorEmail,
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
      await verifyIssueAccess(req.user!.userId, issueId);
      const comments = await CommentService.listComments(issueId);
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
      const result = await CommentService.deleteComment(req.params.commentId as string, req.user!.userId);
      res.json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }
);
