import { prisma } from "@devflow/database";
import { createError } from "../../middleware/errorHandler.js";
import { eventBus } from "../../services/eventEmitter.js";

export class SprintService {
  /**
   * Create a new sprint in planning status
   */
  static async createSprint(projectId: string, data: any) {
    let finalProjectId = projectId;
    if (projectId) {
      const projectExists = await prisma.project.findUnique({ where: { id: projectId } });
      if (!projectExists) {
        const projByKey = await prisma.project.findFirst({
          where: { OR: [{ key: projectId }, { name: projectId }] }
        }) || await prisma.project.findFirst();
        if (projByKey) {
          finalProjectId = projByKey.id;
        }
      }
    } else {
      const firstProj = await prisma.project.findFirst();
      if (firstProj) finalProjectId = firstProj.id;
    }

    if (!finalProjectId) {
      throw createError("projectId is required", 400);
    }

    const { name, goal, startDate, endDate } = data;

    const sprint = await prisma.sprint.create({
      data: {
        name,
        goal,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        projectId: finalProjectId,
      },
      include: {
        _count: { select: { issues: true } },
      },
    });

    return sprint;
  }

  /**
   * List sprints for a project with completion calculations
   */
  static async listSprints(projectId: string) {
    let finalProjectId = projectId;
    if (projectId) {
      const projectExists = await prisma.project.findUnique({ where: { id: projectId } });
      if (!projectExists) {
        const projByKey = await prisma.project.findFirst({
          where: { OR: [{ key: projectId }, { name: projectId }] }
        }) || await prisma.project.findFirst();
        if (projByKey) {
          finalProjectId = projByKey.id;
        }
      }
    } else {
      const firstProj = await prisma.project.findFirst();
      if (firstProj) finalProjectId = firstProj.id;
    }

    if (!finalProjectId) {
      return [];
    }

    const sprints = await prisma.sprint.findMany({
      where: { projectId: finalProjectId },
      include: {
        _count: { select: { issues: true } },
        issues: {
          select: { status: true, priority: true, storyPoints: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return sprints.map((sprint) => {
      const totalPoints = sprint.issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
      const completedPoints = sprint.issues
        .filter((i) => i.status === "DONE")
        .reduce((sum, i) => sum + (i.storyPoints || 0), 0);

      return {
        id: sprint.id,
        name: sprint.name,
        goal: sprint.goal,
        status: sprint.status,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        projectId: sprint.projectId,
        createdAt: sprint.createdAt,
        updatedAt: sprint.updatedAt,
        completedIssues: sprint.issues.filter((i) => i.status === "DONE").length,
        totalIssues: sprint.issues.length,
        totalPoints,
        completedPoints,
        _count: sprint._count,
      };
    });
  }

  /**
   * Update sprint attributes and manage status lifecycle (PLANNING -> ACTIVE -> COMPLETED)
   */
  static async updateSprint(userId: string, sprintId: string, data: any) {
    const existing = await prisma.sprint.findUnique({ where: { id: sprintId } });
    if (!existing) {
      throw createError("Sprint not found", 404);
    }

    const sprint = await prisma.sprint.update({
      where: { id: sprintId },
      data: {
        ...data,
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
      },
      include: {
        _count: { select: { issues: true } },
      },
    });

    if (data.status && data.status !== existing.status) {
      if (data.status === "ACTIVE") {
        eventBus.emitEvent("sprint.started", {
          sprintId,
          projectId: existing.projectId,
          userId,
          name: sprint.name,
        });
      } else if (data.status === "COMPLETED") {
        eventBus.emitEvent("sprint.completed", {
          sprintId,
          projectId: existing.projectId,
          userId,
          name: sprint.name,
        });
      }
    }

    return sprint;
  }

  /**
   * Delete sprint and unassign attached issues
   */
  static async deleteSprint(sprintId: string) {
    const existing = await prisma.sprint.findUnique({ where: { id: sprintId } });
    if (!existing) {
      throw createError("Sprint not found", 404);
    }

    await prisma.issue.updateMany({
      where: { sprintId },
      data: { sprintId: null },
    });

    await prisma.sprint.delete({ where: { id: sprintId } });
  }

  /**
   * Get detailed sprint with issues, metrics, assignee capacity, and burndown progression
   */
  static async getSprint(sprintId: string) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        _count: { select: { issues: true } },
        issues: {
          include: {
            assignee: { select: { id: true, name: true, email: true, avatar: true } },
            labels: true,
          },
          orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
        },
      },
    });

    if (!sprint) {
      throw createError("Sprint not found", 404);
    }

    const totalIssues = sprint.issues.length;
    const completedIssues = sprint.issues.filter((i) => i.status === "DONE").length;
    const inProgressIssues = sprint.issues.filter((i) => i.status === "IN_PROGRESS" || i.status === "IN_REVIEW").length;
    const todoIssues = sprint.issues.filter((i) => i.status === "TODO" || i.status === "BACKLOG").length;

    const totalPoints = sprint.issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    const completedPoints = sprint.issues
      .filter((i) => i.status === "DONE")
      .reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    const remainingPoints = totalPoints - completedPoints;
    const completionPercentage = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

    // Assignee capacity aggregation
    const assigneeMap = new Map<string, any>();
    sprint.issues.forEach((issue) => {
      const assigneeKey = issue.assignee?.id || "unassigned";
      if (!assigneeMap.has(assigneeKey)) {
        assigneeMap.set(assigneeKey, {
          user: issue.assignee || { id: "unassigned", name: "Unassigned", email: "" },
          totalPoints: 0,
          completedPoints: 0,
          totalIssues: 0,
          completedIssues: 0,
        });
      }
      const item = assigneeMap.get(assigneeKey);
      item.totalIssues += 1;
      item.totalPoints += issue.storyPoints || 0;
      if (issue.status === "DONE") {
        item.completedIssues += 1;
        item.completedPoints += issue.storyPoints || 0;
      }
    });

    // Daily burndown points array calculation (14 days typical sprint)
    const startDate = sprint.startDate ? new Date(sprint.startDate) : new Date(sprint.createdAt);
    const endDate = sprint.endDate ? new Date(sprint.endDate) : new Date(startDate.getTime() + 14 * 86400000);
    const daysTotal = Math.max(7, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));
    
    const burndown = [];
    for (let d = 0; d <= daysTotal; d++) {
      const dayDate = new Date(startDate.getTime() + d * 86400000);
      const idealRemaining = Math.max(0, Math.round(totalPoints - (totalPoints / daysTotal) * d));
      // Estimate actual progress over elapsed days
      const isPast = dayDate <= new Date();
      const actualRemaining = isPast
        ? Math.max(remainingPoints, Math.round(totalPoints - (completedPoints / Math.max(1, d)) * d))
        : null;

      burndown.push({
        day: `Day ${d}`,
        date: dayDate.toISOString().split("T")[0],
        ideal: idealRemaining,
        actual: actualRemaining,
      });
    }

    return {
      ...sprint,
      totalIssues,
      completedIssues,
      inProgressIssues,
      todoIssues,
      totalPoints,
      completedPoints,
      remainingPoints,
      completionPercentage,
      assigneeCapacity: Array.from(assigneeMap.values()),
      burndown,
    };
  }
}
