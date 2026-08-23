import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createSprintSchema, updateSprintSchema } from "@devflow/shared";
import { SprintService } from "./sprint.service.js";

export const sprintRouter = Router();

sprintRouter.use(authenticate);

// ─── Create Sprint ──────────────────────────────
sprintRouter.post(
  "/",
  validate(createSprintSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.query.projectId as string;
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
      const sprints = await SprintService.listSprints(projectId);
      res.json({ success: true, data: sprints });
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
      const sprint = await SprintService.updateSprint(
        req.user!.userId,
        req.params.sprintId as string,
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
      await SprintService.deleteSprint(req.params.sprintId as string);
      res.json({ success: true, message: "Sprint deleted" });
    } catch (error) {
      next(error);
    }
  }
);
