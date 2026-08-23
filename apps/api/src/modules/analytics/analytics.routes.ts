import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth.js";
import { AnalyticsService } from "./analytics.service.js";

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);

// ─── Project Analytics Overview ──────────────────
analyticsRouter.get(
  "/projects/:projectId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId as string;
      const data = await AnalyticsService.getProjectAnalytics(projectId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
);
