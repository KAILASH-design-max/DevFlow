import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createWorkspaceSchema } from "@devflow/shared";
import { WorkspaceService } from "./workspace.service.js";

export const workspaceRouter = Router();

// All workspace routes require authentication
workspaceRouter.use(authenticate);

// ─── Create Workspace ───────────────────────────
workspaceRouter.post(
  "/",
  validate(createWorkspaceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspace = await WorkspaceService.createWorkspace(
        req.user!.userId,
        req.body
      );
      res.status(201).json({ success: true, data: workspace });
    } catch (error) {
      next(error);
    }
  }
);

// ─── List My Workspaces ────────────────────────
workspaceRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaces = await WorkspaceService.listUserWorkspaces(
        req.user!.userId
      );
      res.json({ success: true, data: workspaces });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Get Workspace Details ──────────────────────
workspaceRouter.get(
  "/:workspaceId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspace = await WorkspaceService.getWorkspaceById(
        req.params.workspaceId as string
      );
      res.json({ success: true, data: workspace });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Update Workspace ────────────────────────────
workspaceRouter.patch(
  "/:workspaceId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspace = await WorkspaceService.updateWorkspace(
        req.params.workspaceId as string,
        req.body
      );
      res.json({ success: true, data: workspace });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Invite Member ──────────────────────────────
workspaceRouter.post(
  "/:workspaceId/invite",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, role } = req.body;
      const member = await WorkspaceService.inviteMember(
        req.params.workspaceId as string,
        email,
        role
      );
      res.status(201).json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  }
);
