import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createSprintSchema, updateSprintSchema } from "@devflow/shared";
import { SprintService } from "./sprint.service.js";
import { verifyProjectAccess, verifySprintAccess } from "../../middleware/authorizationHelpers.js";

export const sprintRouter = Router();

sprintRouter.use(authenticate);

// ─── Create Sprint ──────────────────────────────
sprintRouter.post(
  "/",
  validate(createSprintSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.query.projectId as string;
      await verifyProjectAccess(req.user!.userId, projectId);
      const sprint = await SprintService.createSprint(projectId, req.body);
      res.status(201).json({ success: true, data: sprint });
    } catch (error) {
      next(error);
    }
  }
);

// ─── List Sprints ───────────────────────────────
sprintRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.query.projectId as string;
      await verifyProjectAccess(req.user!.userId, projectId);
      const sprints = await SprintService.listSprints(projectId);
      res.json({ success: true, data: sprints });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Get Sprint Details ─────────────────────────
sprintRouter.get(
  "/:sprintId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sprintId = req.params.sprintId as string;
      await verifySprintAccess(req.user!.userId, sprintId);
      const sprint = await SprintService.getSprint(sprintId);
      res.json({ success: true, data: sprint });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Update Sprint ──────────────────────────────
sprintRouter.patch(
  "/:sprintId",
  validate(updateSprintSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sprintId = req.params.sprintId as string;
      await verifySprintAccess(req.user!.userId, sprintId);
      const sprint = await SprintService.updateSprint(
        req.user!.userId,
        sprintId,
        req.body
      );
      res.json({ success: true, data: sprint });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Delete Sprint ──────────────────────────────
sprintRouter.delete(
  "/:sprintId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sprintId = req.params.sprintId as string;
      await verifySprintAccess(req.user!.userId, sprintId);
      await SprintService.deleteSprint(sprintId);
      res.json({ success: true, message: "Sprint deleted" });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Generate & Fetch Retrospective ─────────────
sprintRouter.post(
  "/:sprintId/retrospective/generate",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sprintId = req.params.sprintId as string;
      await verifySprintAccess(req.user!.userId, sprintId);
      const { AIService } = await import("../ai/ai.service.js");
      const retrospective = await AIService.generateRetrospective(sprintId);
      res.json({ success: true, data: retrospective });
    } catch (error) {
      next(error);
    }
  }
);

sprintRouter.get(
  "/:sprintId/retrospective",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sprintId = req.params.sprintId as string;
      await verifySprintAccess(req.user!.userId, sprintId);
      const sprint = await SprintService.getSprint(sprintId);
      let data = null;
      if (sprint.retrospective) {
        try {
          data = JSON.parse(sprint.retrospective);
        } catch {
          data = sprint.retrospective;
        }
      }
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
);
