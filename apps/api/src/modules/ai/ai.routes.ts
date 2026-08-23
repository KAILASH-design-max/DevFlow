import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { analyzeIssueSchema } from "@devflow/shared";
import { AIService } from "./ai.service.js";

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

      const result = await AIService.detectDuplicates(title, projectId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Summarize Sprint ───────────────────────────
aiRouter.post(
  "/summarize-sprint",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sprintId } = req.body;
      const summary = await AIService.summarizeSprint(sprintId);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
);
