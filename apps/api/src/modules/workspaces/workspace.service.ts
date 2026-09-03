import { prisma } from "@devflow/database";
import { createError } from "../../middleware/errorHandler.js";
import crypto from "crypto";

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
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
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
   * Update workspace name, description, slug
   */
  static async updateWorkspace(
    workspaceId: string,
    data: { name?: string; description?: string; slug?: string }
  ) {
    const existing = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!existing) {
      throw createError("Workspace not found", 404);
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugConflict = await prisma.workspace.findUnique({ where: { slug: data.slug } });
      if (slugConflict) {
        throw createError("Slug is already in use by another workspace", 409);
      }
    }

    return prisma.workspace.update({
      where: { id: workspaceId },
      data,
    });
  }

  /**
   * Invite member by email and assign role
   */
  static async inviteMember(workspaceId: string, email: string, role?: string, inviterId?: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    
    // If user already exists in DB, add directly to workspace
    if (user) {
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

    // Otherwise create pending invite token
    const token = crypto.randomBytes(24).toString("hex");
    
    const newInvite = await prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        email,
        role: role || "DEVELOPER",
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    });

    return {
      message: "Pending invitation created",
      invitation: {
        ...newInvite,
        inviteUrl: `http://localhost:3000/join/${workspaceId}?token=${token}`
      },
    };
  }

  /**
   * Update member role with last admin safeguard
   */
  static async updateMemberRole(workspaceId: string, memberId: string, newRole: string) {
    const member = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.workspaceId !== workspaceId) {
      throw createError("Workspace member not found", 404);
    }

    // If demoting an ADMIN, ensure at least one other ADMIN exists
    if (member.role === "ADMIN" && newRole !== "ADMIN") {
      const adminCount = await prisma.workspaceMember.count({
        where: { workspaceId, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        throw createError("Cannot demote the sole Administrator of the workspace", 400);
      }
    }

    return prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: newRole as any },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });
  }

  /**
   * Remove member from workspace
   */
  static async removeMember(workspaceId: string, memberId: string) {
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) throw createError("Workspace not found", 404);

    const member = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.workspaceId !== workspaceId) {
      throw createError("Workspace member not found", 404);
    }

    if (member.userId === workspace.ownerId) {
      throw createError("Cannot remove the Workspace Owner. Transfer ownership first.", 400);
    }

    if (member.role === "ADMIN") {
      const adminCount = await prisma.workspaceMember.count({
        where: { workspaceId, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        throw createError("Cannot remove the sole Administrator of the workspace", 400);
      }
    }

    return prisma.workspaceMember.delete({
      where: { id: memberId },
    });
  }

  /**
   * Create shareable invite join link
   */
  static async createShareableInviteLink(workspaceId: string, role: string = "DEVELOPER") {
    const token = crypto.randomBytes(24).toString("hex");
    
    const newInvite = await prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        email: "Shareable Link",
        role,
        token,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      }
    });

    const inviteUrl = `http://localhost:3000/join/${workspaceId}?token=${token}&role=${role}`;

    return {
      ...newInvite,
      inviteUrl,
      joinUrl: inviteUrl
    };
  }

  /**
   * List pending invitations
   */
  static async listPendingInvites(workspaceId: string) {
    const invites = await prisma.workspaceInvitation.findMany({
      where: { workspaceId }
    });
    
    return invites.map(inv => ({
      ...inv,
      inviteUrl: `http://localhost:3000/join/${workspaceId}?token=${inv.token}`
    }));
  }

  /**
   * Revoke pending invitation
   */
  static async revokeInvite(workspaceId: string, inviteId: string) {
    await prisma.workspaceInvitation.deleteMany({
      where: {
        id: inviteId,
        workspaceId
      }
    });
    return { success: true };
  }

  /**
   * Get workspace security policies
   */
  static async getSecurityPolicies(workspaceId: string) {
    const policy = await prisma.workspaceSecurityPolicy.findUnique({
      where: { workspaceId }
    });
    
    if (policy) return policy;

    // Create default if not exists
    return prisma.workspaceSecurityPolicy.create({
      data: { workspaceId }
    });
  }

  /**
   * Update workspace security policies
   */
  static async updateSecurityPolicies(
    workspaceId: string,
    policies: any
  ) {
    const safePolicies = {
      enforceTwoFactor: policies.enforceTwoFactor,
      restrictProjectCreation: policies.restrictProjectCreation,
      publicIssuesRead: policies.publicIssuesRead,
      sessionTimeoutHours: policies.sessionTimeoutHours !== undefined ? Number(policies.sessionTimeoutHours) : undefined
    };

    // Remove undefined values
    Object.keys(safePolicies).forEach((key) => safePolicies[key as keyof typeof safePolicies] === undefined && delete safePolicies[key as keyof typeof safePolicies]);

    return prisma.workspaceSecurityPolicy.upsert({
      where: { workspaceId },
      create: { workspaceId, ...safePolicies },
      update: safePolicies
    });
  }

  /**
   * Transfer workspace ownership to another member
   */
  static async transferOwnership(
    workspaceId: string,
    currentOwnerId: string,
    newOwnerId: string
  ) {
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) throw createError("Workspace not found", 404);

    if (workspace.ownerId !== currentOwnerId) {
      throw createError("Only the current workspace owner can transfer ownership", 403);
    }

    const targetMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: newOwnerId,
          workspaceId,
        },
      },
    });

    if (!targetMember) {
      throw createError("Target user must be a member of the workspace", 400);
    }

    // Ensure target member is ADMIN
    await prisma.workspaceMember.update({
      where: { id: targetMember.id },
      data: { role: "ADMIN" },
    });

    return prisma.workspace.update({
      where: { id: workspaceId },
      data: { ownerId: newOwnerId },
    });
  }

  /**
   * Delete workspace (owner only)
   */
  static async deleteWorkspace(workspaceId: string, ownerId: string) {
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) throw createError("Workspace not found", 404);

    if (workspace.ownerId !== ownerId) {
      throw createError("Only the workspace owner can delete the workspace", 403);
    }

    return prisma.workspace.delete({
      where: { id: workspaceId },
    });
  }
}
