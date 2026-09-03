import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth.js";
import { AnalyticsService } from "./analytics.service.js";
import { verifyProjectAccess } from "../../middleware/authorizationHelpers.js";

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);

// ─── Project Analytics Overview ──────────────────
analyticsRouter.get(
  "/projects/:projectId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId as string;
      await verifyProjectAccess(req.user!.userId, projectId);
      const data = await AnalyticsService.getProjectAnalytics(projectId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
);

analyticsRouter.get(
  "/:projectId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId as string;
      await verifyProjectAccess(req.user!.userId, projectId);
      const data = await AnalyticsService.getProjectAnalytics(projectId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
);
