import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createError } from "../../middleware/errorHandler.js";
import { createIssueSchema, updateIssueSchema } from "@devflow/shared";
import { IssueService } from "./issue.service.js";

export const issueRouter = Router();

issueRouter.use(authenticate);

// ─── Create Issue ───────────────────────────────
issueRouter.post(
  "/",
  validate(createIssueSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.query.projectId as string;
      if (!projectId) {
        throw createError("projectId query parameter is required", 400);
      }

      const issue = await IssueService.createIssue(
        req.user!.userId,
        projectId,
        req.body
      );

      res.status(201).json({ success: true, data: issue });
    } catch (error) {
      next(error);
    }
  }
);

// ─── List Issues (with filtering & pagination) ─
issueRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        projectId,
        status,
        priority,
        type,
        assigneeId,
        sprintId,
        search,
        page = "1",
        limit = "50",
      } = req.query;

      if (!projectId) {
        throw createError("projectId query parameter is required", 400);
      }

      const result = await IssueService.listIssues({
        projectId: projectId as string,
        status: status as string | undefined,
        priority: priority as string | undefined,
        type: type as string | undefined,
        assigneeId: assigneeId as string | undefined,
        sprintId: sprintId as string | undefined,
        search: search as string | undefined,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      });

      res.json({
        success: true,
        data: result.issues,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Get Issue Detail ───────────────────────────
issueRouter.get(
  "/:issueId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const issue = await IssueService.getIssueById(req.params.issueId as string);
      res.json({ success: true, data: issue });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Update Issue ───────────────────────────────
issueRouter.patch(
  "/:issueId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const issue = await IssueService.updateIssue(
        req.user!.userId,
        req.params.issueId as string,
        req.body
      );
      res.json({ success: true, data: issue });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Delete Issue ───────────────────────────────
issueRouter.delete(
  "/:issueId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await IssueService.deleteIssue(req.params.issueId as string);
      res.json({ success: true, message: "Issue deleted" });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Kanban: Move Card ──────────────────────────
issueRouter.patch(
  "/:issueId/move",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, position } = req.body;
      const issue = await IssueService.moveIssue(
        req.user!.userId,
        req.params.issueId as string,
        status,
        position
      );
      res.json({ success: true, data: issue });
    } catch (error) {
      next(error);
    }
  }
);
