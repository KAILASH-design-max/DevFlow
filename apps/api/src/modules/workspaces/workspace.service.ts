import { prisma } from "@devflow/database";
import { createError } from "../../middleware/errorHandler.js";

export class WorkspaceService {
  /**
   * Create new workspace with auto-generated slug and assign creator as ADMIN
   */
  static async createWorkspace(userId: string, data: { name: string; description?: string }) {
    const { name, description } = data;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const existing = await prisma.workspace.findUnique({ where: { slug } });
    if (existing) {
      throw createError("Workspace slug already taken", 409);
    }

    return prisma.workspace.create({
      data: {
        name,
        slug,
        description,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: "ADMIN",
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });
  }

  /**
   * List workspaces where user is a member
   */
  static async listUserWorkspaces(userId: string) {
    return prisma.workspace.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        _count: {
          select: { members: true, projects: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get single workspace details including member roster and project summaries
   */
  static async getWorkspaceById(workspaceId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            key: true,
            _count: { select: { issues: true, members: true } },
          },
        },
        _count: { select: { members: true, projects: true } },
      },
    });

    if (!workspace) {
      throw createError("Workspace not found", 404);
    }

    return workspace;
  }

  /**
   * Update workspace name and description
   */
  static async updateWorkspace(workspaceId: string, data: { name?: string; description?: string }) {
    const existing = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!existing) {
      throw createError("Workspace not found", 404);
    }

    return prisma.workspace.update({
      where: { id: workspaceId },
      data,
    });
  }

  /**
   * Invite member by email and assign role
   */
  static async inviteMember(workspaceId: string, email: string, role?: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw createError("User not found with this email", 404);
    }

    const existing = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });

    if (existing) {
      throw createError("User is already a member of this workspace", 409);
    }

    return prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId,
        role: role || "DEVELOPER",
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });
  }
}
