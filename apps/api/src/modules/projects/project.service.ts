import { prisma } from "@devflow/database";
import { createError } from "../../middleware/errorHandler.js";

export class ProjectService {
  /**
   * Create a new project within a workspace and assign creator as ADMIN
   */
  static async createProject(userId: string, workspaceId: string, data: { name: string; key: string; description?: string }) {
    if (!workspaceId) {
      throw createError("workspaceId is required", 400);
    }

    const { name, key, description } = data;

    const existing = await prisma.project.findUnique({
      where: { workspaceId_key: { workspaceId, key: key.toUpperCase() } },
    });
    if (existing) {
      throw createError(`Project key "${key}" already exists in this workspace`, 409);
    }

    const project = await prisma.project.create({
      data: {
        name,
        key: key.toUpperCase(),
        description,
        workspaceId,
        members: {
          create: {
            userId,
            role: "ADMIN",
          },
        },
      },
      include: {
        _count: { select: { issues: true, members: true } },
      },
    });

    return project;
  }

  /**
   * List projects belonging to a workspace
   */
  static async listProjects(workspaceId: string) {
    if (!workspaceId) {
      throw createError("workspaceId is required", 400);
    }

    return prisma.project.findMany({
      where: { workspaceId },
      include: {
        _count: { select: { issues: true, members: true, sprints: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get single project details, members, labels, and active sprints
   */
  static async getProjectById(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        labels: true,
        sprints: {
          where: { status: { not: "COMPLETED" } },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { issues: true, members: true } },
      },
    });

    if (!project) {
      throw createError("Project not found", 404);
    }

    return project;
  }

  /**
   * Update project settings
   */
  static async updateProject(projectId: string, data: any) {
    const existing = await prisma.project.findUnique({ where: { id: projectId } });
    if (!existing) {
      throw createError("Project not found", 404);
    }

    // Mass assignment prevention: allowlist safe fields only
    const safeData: { name?: string; description?: string } = {};
    if (typeof data.name === "string" && data.name.trim().length > 0) {
      safeData.name = data.name.trim();
    }
    if (typeof data.description !== "undefined") {
      safeData.description = data.description;
    }

    return prisma.project.update({
      where: { id: projectId },
      data: safeData,
    });
  }

  /**
   * Delete project
   */
  static async deleteProject(projectId: string) {
    const existing = await prisma.project.findUnique({ where: { id: projectId } });
    if (!existing) {
      throw createError("Project not found", 404);
    }

    await prisma.project.delete({ where: { id: projectId } });
  }
}
