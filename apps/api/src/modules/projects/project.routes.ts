import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createError } from "../../middleware/errorHandler.js";
import { createProjectSchema } from "@devflow/shared";
import { ProjectService } from "./project.service.js";
import { verifyWorkspaceMembership, verifyProjectAccess } from "../../middleware/authorizationHelpers.js";

export const projectRouter = Router();

projectRouter.use(authenticate);

// ─── Create Project ─────────────────────────────
projectRouter.post(
  "/",
  validate(createProjectSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        throw createError("workspaceId query parameter is required", 400);
      }

      // SECURITY: Verify user is a member of the workspace
      await verifyWorkspaceMembership(req.user!.userId, workspaceId);

      const project = await ProjectService.createProject(
        req.user!.userId,
        workspaceId,
        req.body
      );

      res.status(201).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }
);

// ─── List Projects in Workspace ─────────────────
projectRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        throw createError("workspaceId query parameter is required", 400);
      }

      // SECURITY: Verify user is a member of the workspace
      await verifyWorkspaceMembership(req.user!.userId, workspaceId);

      const projects = await ProjectService.listProjects(workspaceId);
      res.json({ success: true, data: projects });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Get Project Details ────────────────────────
projectRouter.get(
  "/:projectId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // SECURITY: Verify user has access to this project's workspace
      await verifyProjectAccess(req.user!.userId, req.params.projectId as string);

      const project = await ProjectService.getProjectById(
        req.params.projectId as string
      );
      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Update Project ─────────────────────────────
projectRouter.patch(
  "/:projectId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // SECURITY: Verify user has access (ADMIN required for updates)
      await verifyProjectAccess(req.user!.userId, req.params.projectId as string, ["ADMIN"]);

      const project = await ProjectService.updateProject(
        req.params.projectId as string,
        req.body
      );
      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Delete Project ─────────────────────────────
projectRouter.delete(
  "/:projectId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // SECURITY: Only ADMINs can delete projects
      await verifyProjectAccess(req.user!.userId, req.params.projectId as string, ["ADMIN"]);

      await ProjectService.deleteProject(req.params.projectId as string);
      res.json({ success: true, message: "Project deleted" });
    } catch (error) {
      next(error);
    }
  }
);
