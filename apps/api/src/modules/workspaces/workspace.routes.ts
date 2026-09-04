import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createWorkspaceSchema } from "@devflow/shared";
import { WorkspaceService } from "./workspace.service.js";
import { verifyWorkspaceMembership } from "../../middleware/authorizationHelpers.js";
import { createError } from "../../middleware/errorHandler.js";

export const workspaceRouter = Router();

// ─── Public: Fetch Invitation Details ─────────────
workspaceRouter.get(
  "/invites/details",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workspaceId, token, role } = req.query;
      if (!workspaceId) {
        return res.status(400).json({ success: false, message: "Workspace identifier is required" });
      }

      const details = await WorkspaceService.getInviteDetails(
        workspaceId as string,
        token as string | undefined,
        role as string | undefined
      );

      res.json({ success: true, data: details });
    } catch (error) {
      next(error);
    }
  }
);

// All subsequent workspace routes require authentication
workspaceRouter.use(authenticate);

// ─── Authenticated: Accept Workspace Invitation ───
workspaceRouter.post(
  "/invites/accept",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workspaceId, token, role } = req.body;
      if (!workspaceId) {
        return res.status(400).json({ success: false, message: "Workspace identifier is required" });
      }

      const result = await WorkspaceService.acceptInvite(
        req.user!.userId,
        workspaceId,
        token,
        role
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

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
      // SECURITY: Verify user is a member of this workspace
      await verifyWorkspaceMembership(req.user!.userId, req.params.workspaceId as string);

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
      // SECURITY: Only ADMINs can update workspace settings
      await verifyWorkspaceMembership(req.user!.userId, req.params.workspaceId as string, ["ADMIN", "OWNER"]);

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
      // SECURITY: Only ADMINs can invite members
      await verifyWorkspaceMembership(req.user!.userId, req.params.workspaceId as string, ["ADMIN", "OWNER"]);

      const { email, role } = req.body;
      if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        throw createError("Please enter a valid email address", 400);
      }

      const member = await WorkspaceService.inviteMember(
        req.params.workspaceId as string,
        email.trim(),
        role,
        req.user!.userId
      );
      res.status(201).json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Update Member Role ─────────────────────────
workspaceRouter.patch(
  "/:workspaceId/members/:memberId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // SECURITY: Only ADMINs can change member roles
      await verifyWorkspaceMembership(req.user!.userId, req.params.workspaceId as string, ["ADMIN", "OWNER"]);

      const { role } = req.body;
      const member = await WorkspaceService.updateMemberRole(
        req.params.workspaceId as string,
        req.params.memberId as string,
        role
      );
      res.json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Remove Member ──────────────────────────────
workspaceRouter.delete(
  "/:workspaceId/members/:memberId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // SECURITY: Only ADMINs can remove members
      await verifyWorkspaceMembership(req.user!.userId, req.params.workspaceId as string, ["ADMIN", "OWNER"]);

      await WorkspaceService.removeMember(
        req.params.workspaceId as string,
        req.params.memberId as string
      );
      res.json({ success: true, message: "Member removed from workspace" });
    } catch (error) {
      next(error);
    }
  }
);

// ─── List Pending Invites ───────────────────────
workspaceRouter.get(
  "/:workspaceId/invites",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // SECURITY: Only ADMINs can view pending invites
      await verifyWorkspaceMembership(req.user!.userId, req.params.workspaceId as string, ["ADMIN", "OWNER"]);

      const invites = await WorkspaceService.listPendingInvites(
        req.params.workspaceId as string
      );
      res.json({ success: true, data: invites });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Create Shareable Invite Link ───────────────
workspaceRouter.post(
  "/:workspaceId/invites/link",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // SECURITY: Only ADMINs can create invite links
      await verifyWorkspaceMembership(req.user!.userId, req.params.workspaceId as string, ["ADMIN", "OWNER"]);

      const { role } = req.body;
      const invite = await WorkspaceService.createShareableInviteLink(
        req.params.workspaceId as string,
        role
      );
      res.status(201).json({ success: true, data: invite });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Revoke Pending Invite ──────────────────────
workspaceRouter.delete(
  "/:workspaceId/invites/:inviteId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // SECURITY: Only ADMINs can revoke invites
      await verifyWorkspaceMembership(req.user!.userId, req.params.workspaceId as string, ["ADMIN", "OWNER"]);

      await WorkspaceService.revokeInvite(
        req.params.workspaceId as string,
        req.params.inviteId as string
      );
      res.json({ success: true, message: "Invitation revoked" });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Get Security Policies ──────────────────────
workspaceRouter.get(
  "/:workspaceId/security",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // SECURITY: Only ADMINs can view security policies
      await verifyWorkspaceMembership(req.user!.userId, req.params.workspaceId as string, ["ADMIN", "OWNER"]);

      const policies = await WorkspaceService.getSecurityPolicies(
        req.params.workspaceId as string
      );
      res.json({ success: true, data: policies });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Update Security Policies ───────────────────
workspaceRouter.patch(
  "/:workspaceId/security",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // SECURITY: Only ADMINs can update security policies
      await verifyWorkspaceMembership(req.user!.userId, req.params.workspaceId as string, ["ADMIN", "OWNER"]);

      const policies = await WorkspaceService.updateSecurityPolicies(
        req.params.workspaceId as string,
        req.body
      );
      res.json({ success: true, data: policies });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Transfer Workspace Ownership ───────────────
workspaceRouter.post(
  "/:workspaceId/transfer-ownership",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // SECURITY: Only ADMINs can transfer ownership (service further checks ownerId)
      await verifyWorkspaceMembership(req.user!.userId, req.params.workspaceId as string, ["ADMIN", "OWNER"]);

      const { newOwnerId } = req.body;
      const workspace = await WorkspaceService.transferOwnership(
        req.params.workspaceId as string,
        req.user!.userId,
        newOwnerId
      );
      res.json({ success: true, data: workspace });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Delete Workspace ───────────────────────────
workspaceRouter.delete(
  "/:workspaceId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // SECURITY: Only ADMINs can delete workspace (service further checks ownerId)
      await verifyWorkspaceMembership(req.user!.userId, req.params.workspaceId as string, ["ADMIN", "OWNER"]);

      await WorkspaceService.deleteWorkspace(
        req.params.workspaceId as string,
        req.user!.userId
      );
      res.json({ success: true, message: "Workspace deleted" });
    } catch (error) {
      next(error);
    }
  }
);
