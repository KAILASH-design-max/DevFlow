import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createError } from "../../middleware/errorHandler.js";
import { createIssueSchema, updateIssueSchema } from "@devflow/shared";
import { IssueService } from "./issue.service.js";
import { verifyProjectAccess, verifyIssueAccess } from "../../middleware/authorizationHelpers.js";

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

      // SECURITY: Verify user has access to this project
      await verifyProjectAccess(req.user!.userId, projectId);

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

      // SECURITY: Verify user has access to this project
      await verifyProjectAccess(req.user!.userId, projectId as string);

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
      // SECURITY: Verify user has access to this issue's project
      await verifyIssueAccess(req.user!.userId, req.params.issueId as string);

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
  validate(updateIssueSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // SECURITY: Verify user has access to this issue's project
      await verifyIssueAccess(req.user!.userId, req.params.issueId as string);

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
      const userId = req.user!.userId;
      // SECURITY: Verify user has access to this issue's project
      const { issue, member } = await verifyIssueAccess(userId, req.params.issueId as string);

      // Only ADMIN, PROJECT_MANAGER, or the original issue reporter can delete an issue
      const isAdminOrPm = member.role === "ADMIN" || member.role === "PROJECT_MANAGER";
      const isReporter = (issue as any).reporterId === userId;
      if (!isAdminOrPm && !isReporter) {
        throw createError("Only project managers, admins, or the issue reporter can delete this issue", 403);
      }

      await IssueService.deleteIssue(userId, req.params.issueId as string);
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
      // SECURITY: Verify user has access to this issue's project
      await verifyIssueAccess(req.user!.userId, req.params.issueId as string);

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

// ─── Timeline Activities ────────────────────────
issueRouter.get(
  "/:issueId/activities",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // SECURITY: Verify user has access to this issue's project
      await verifyIssueAccess(req.user!.userId, req.params.issueId as string);

      const activities = await IssueService.getActivities(req.params.issueId as string);
      res.json({ success: true, data: activities });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Time Tracking (Work Logs) ─────────────────
issueRouter.post(
  "/:issueId/worklogs",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // SECURITY: Verify user has access to this issue's project
      await verifyIssueAccess(req.user!.userId, req.params.issueId as string);

      const { timeSpentMinutes, description } = req.body;
      if (!timeSpentMinutes || typeof timeSpentMinutes !== "number") {
        throw createError("timeSpentMinutes is required and must be a number", 400);
      }
      const workLog = await IssueService.logWork(
        req.user!.userId,
        req.params.issueId as string,
        { timeSpentMinutes, description }
      );
      res.status(201).json({ success: true, data: workLog });
    } catch (error) {
      next(error);
    }
  }
);

issueRouter.get(
  "/:issueId/worklogs",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // SECURITY: Verify user has access to this issue's project
      await verifyIssueAccess(req.user!.userId, req.params.issueId as string);

      const workLogs = await IssueService.getWorkLogs(req.params.issueId as string);
      res.json({ success: true, data: workLogs });
    } catch (error) {
      next(error);
    }
  }
);

issueRouter.delete(
  "/:issueId/worklogs/:workLogId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // SECURITY: Verify user has access to this issue's project
      await verifyIssueAccess(req.user!.userId, req.params.issueId as string);

      await IssueService.deleteWorkLog(
        req.user!.userId,
        req.params.issueId as string,
        req.params.workLogId as string
      );
      res.json({ success: true, message: "Work log deleted" });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Git Commit Attachments ────────────────────
issueRouter.post(
  "/:issueId/commits",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // SECURITY: Verify user has access to this issue's project
      await verifyIssueAccess(req.user!.userId, req.params.issueId as string);

      const { hash, message, authorName, authorAvatar, url, branch } = req.body;
      if (!hash || !message) {
        throw createError("hash and message are required fields", 400);
      }
      const commit = await IssueService.attachCommit(
        req.user!.userId,
        req.params.issueId as string,
        {
          hash,
          message,
          authorName: authorName || req.user!.email || "Developer",
          authorAvatar,
          url,
          branch,
        }
      );
      res.status(201).json({ success: true, data: commit });
    } catch (error) {
      next(error);
    }
  }
);

issueRouter.get(
  "/:issueId/commits",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // SECURITY: Verify user has access to this issue's project
      await verifyIssueAccess(req.user!.userId, req.params.issueId as string);

      const commits = await IssueService.getCommits(req.params.issueId as string);
      res.json({ success: true, data: commits });
    } catch (error) {
      next(error);
    }
  }
);
