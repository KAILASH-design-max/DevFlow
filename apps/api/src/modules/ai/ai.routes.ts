import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { analyzeIssueSchema } from "@devflow/shared";
import { AIService } from "./ai.service.js";
import {
  verifyProjectAccess,
  verifySprintAccess,
} from "../../middleware/authorizationHelpers.js";

export const aiRouter = Router();

aiRouter.use(authenticate);

// ─── Analyze Issue (AI Breakdown) ───────────────
aiRouter.post(
  "/analyze-issue",
  validate(analyzeIssueSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, description } = req.body;
      const projectId = req.query.projectId as string | undefined;

      // SECURITY: If projectId is provided, verify caller has access
      if (projectId) {
        await verifyProjectAccess(req.user!.userId, projectId);
      }

      const analysis = await AIService.analyzeIssue(
        title,
        description,
        projectId
      );

      res.json({ success: true, data: analysis });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Detect Duplicate Issues ────────────────────
aiRouter.post(
  "/detect-duplicates",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title } = req.body;
      const projectId = req.query.projectId as string;

      if (!projectId) {
        return res.status(400).json({ success: false, error: "projectId query parameter is required" });
      }

      // SECURITY: Verify caller has access to the project
      await verifyProjectAccess(req.user!.userId, projectId);

      const result = await AIService.detectDuplicates(title, projectId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Summarize PR ───────────────────────────────
aiRouter.post(
  "/summarize-pr",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, headBranch, baseBranch, issueKey } = req.body;
      const summary = await AIService.summarizePR({
        title,
        headBranch,
        baseBranch,
        issueKey,
      });
      res.json({ success: true, data: { summary } });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Sprint Retrospective Summary ───────────────
aiRouter.post(
  "/sprint-retrospective/generate",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sprintId } = req.body;
      if (!sprintId) {
        return res.status(400).json({ success: false, error: "sprintId is required" });
      }

      // SECURITY: Verify caller has access to the sprint
      await verifySprintAccess(req.user!.userId, sprintId);

      const retrospective = await AIService.generateRetrospective(sprintId);
      res.json({ success: true, data: retrospective });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Release Notes Generator ────────────────────
aiRouter.post(
  "/release-notes/generate",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId, sprintId, targetAudience, versionName } = req.body;
      if (!projectId) {
        return res.status(400).json({ success: false, error: "projectId is required" });
      }

      // SECURITY: Verify caller has access to project & sprint
      await verifyProjectAccess(req.user!.userId, projectId);
      if (sprintId) {
        await verifySprintAccess(req.user!.userId, sprintId);
      }

      const releaseNotes = await AIService.generateReleaseNotes({
        projectId,
        sprintId,
        targetAudience,
        versionName,
      });
      res.json({ success: true, data: { releaseNotes } });
    } catch (error) {
      next(error);
    }
  }
);

