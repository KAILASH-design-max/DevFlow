import { prisma } from "@devflow/database";
import { createError } from "../../middleware/errorHandler.js";
import { eventBus } from "../../services/eventEmitter.js";

export class SprintService {
  /**
   * Create a new sprint in planning status
   */
  static async createSprint(projectId: string, data: any) {
    if (!projectId) {
      throw createError("projectId is required", 400);
    }

    const { name, goal, startDate, endDate } = data;

    const sprint = await prisma.sprint.create({
      data: {
        name,
        goal,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        projectId,
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
    if (!projectId) {
      throw createError("projectId is required", 400);
    }

    const sprints = await prisma.sprint.findMany({
      where: { projectId },
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
}
