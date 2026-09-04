import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "@devflow/database";
import { authenticate } from "../../middleware/auth.js";
import { verifyWorkspaceMembership, verifyProjectAccess } from "../../middleware/authorizationHelpers.js";

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

// ─── Dashboard Stats ────────────────────────────
dashboardRouter.get(
  "/stats",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.query.workspaceId as string;

      if (!workspaceId) {
        res.status(400).json({ success: false, error: "workspaceId is required" });
        return;
      }
      await verifyWorkspaceMembership(req.user!.userId, workspaceId);

      const projectIds = (
        await prisma.project.findMany({
          where: { workspaceId },
          select: { id: true },
        })
      ).map((p) => p.id);

      const [totalIssues, openBugs, activeSprints, teamMembers] =
        await Promise.all([
          prisma.issue.count({
            where: { projectId: { in: projectIds } },
          }),
          prisma.issue.count({
            where: {
              projectId: { in: projectIds },
              type: "BUG",
              status: { not: "DONE" },
            },
          }),
          prisma.sprint.count({
            where: {
              projectId: { in: projectIds },
              status: "ACTIVE",
            },
          }),
          prisma.workspaceMember.count({
            where: { workspaceId },
          }),
        ]);

      res.json({
        success: true,
        data: { totalIssues, openBugs, activeSprints, teamMembers },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Recent Activity ────────────────────────────
dashboardRouter.get(
  "/activity",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        res.status(400).json({ success: false, error: "workspaceId is required" });
        return;
      }
      await verifyWorkspaceMembership(req.user!.userId, workspaceId);

      // Resolve all projects, issues, and sprints within this workspace to strictly scope logs
      const projects = await prisma.project.findMany({
        where: { workspaceId },
        select: {
          id: true,
          issues: { select: { id: true } },
          sprints: { select: { id: true } },
        },
      });

      const projectIds = projects.map((p) => p.id);
      const issueIds = projects.flatMap((p) => p.issues.map((i) => i.id));
      const sprintIds = projects.flatMap((p) => p.sprints.map((s) => s.id));
      const entityIds = [workspaceId, ...projectIds, ...issueIds, ...sprintIds];

      const activity = await prisma.auditLog.findMany({
        where: {
          entityId: { in: entityIds },
        },
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      res.json({ success: true, data: activity });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Issue Velocity (Chart Data) ────────────────
dashboardRouter.get(
  "/velocity",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      const days = parseInt(req.query.days as string) || 14;
      if (!workspaceId) {
        res.status(400).json({ success: false, error: "workspaceId is required" });
        return;
      }
      await verifyWorkspaceMembership(req.user!.userId, workspaceId);

      const projectIds = (
        await prisma.project.findMany({
          where: { workspaceId },
          select: { id: true },
        })
      ).map((p) => p.id);

      // Get issues created and resolved per day for the last N days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const issues = await prisma.issue.findMany({
        where: {
          projectId: { in: projectIds },
          createdAt: { gte: startDate },
        },
        select: { createdAt: true, status: true, updatedAt: true },
      });

      // Group by date
      const velocityData: { date: string; created: number; resolved: number }[] = [];

      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dateStr = date.toISOString().split("T")[0];

        const created = issues.filter(
          (issue) => issue.createdAt.toISOString().split("T")[0] === dateStr
        ).length;

        const resolved = issues.filter(
          (issue) =>
            issue.status === "DONE" &&
            issue.updatedAt.toISOString().split("T")[0] === dateStr
        ).length;

        velocityData.push({ date: dateStr, created, resolved });
      }

      res.json({ success: true, data: velocityData });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Issue Distribution (Chart Data) ────────────
dashboardRouter.get(
  "/distribution",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.query.projectId as string;

      if (!projectId) {
        res.status(400).json({ success: false, error: "projectId is required" });
        return;
      }
      await verifyProjectAccess(req.user!.userId, projectId);

      const [byStatus, byPriority, byType] = await Promise.all([
        prisma.issue.groupBy({
          by: ["status"],
          where: { projectId },
          _count: true,
        }),
        prisma.issue.groupBy({
          by: ["priority"],
          where: { projectId },
          _count: true,
        }),
        prisma.issue.groupBy({
          by: ["type"],
          where: { projectId },
          _count: true,
        }),
      ]);

      res.json({
        success: true,
        data: {
          byStatus: byStatus.map((s) => ({
            name: s.status,
            count: s._count,
          })),
          byPriority: byPriority.map((p) => ({
            name: p.priority,
            count: p._count,
          })),
          byType: byType.map((t) => ({
            name: t.type,
            count: t._count,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);
