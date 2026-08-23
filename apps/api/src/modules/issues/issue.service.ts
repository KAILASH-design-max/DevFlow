import { prisma } from "@devflow/database";
import { createError } from "../../middleware/errorHandler.js";
import { eventBus } from "../../services/eventEmitter.js";

export interface ListIssuesFilter {
  projectId: string;
  status?: string;
  priority?: string;
  type?: string;
  assigneeId?: string;
  sprintId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class IssueService {
  /**
   * Create a new issue with project-scoped sequential numbering and audit logging
   */
  static async createIssue(userId: string, projectId: string, data: any) {
    const {
      title,
      description,
      type,
      priority,
      assigneeId,
      sprintId,
      labelIds,
      storyPoints,
      dueDate,
      parentId,
    } = data;

    // Find last issue number in this project
    const lastIssue = await prisma.issue.findFirst({
      where: { projectId },
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const issueNumber = (lastIssue?.number || 0) + 1;

    // Get max position for column
    const maxPosition = await prisma.issue.aggregate({
      where: { projectId, status: "BACKLOG" },
      _max: { position: true },
    });
    const position = (maxPosition._max.position || 0) + 1;

    const issue = await prisma.issue.create({
      data: {
        number: issueNumber,
        title,
        description,
        type: type || "TASK",
        status: "BACKLOG",
        priority: priority || "MEDIUM",
        storyPoints,
        dueDate: dueDate ? new Date(dueDate) : null,
        position,
        projectId,
        assigneeId,
        reporterId: userId,
        sprintId,
        parentId,
        labels: labelIds
          ? {
              create: labelIds.map((labelId: string) => ({
                labelId,
              })),
            }
          : undefined,
      },
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
        reporter: {
          select: { id: true, name: true, avatar: true },
        },
        labels: {
          include: { label: true },
        },
        sprint: {
          select: { id: true, name: true },
        },
        _count: { select: { comments: true, subtasks: true } },
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: "CREATED",
        entityType: "ISSUE",
        entityId: issue.id,
        userId,
        metadata: JSON.stringify({ title, type, priority, number: issueNumber }),
      },
    });

    // Emit domain event
    eventBus.emitEvent("issue.created", {
      issueId: issue.id,
      projectId,
      userId,
      title: issue.title,
      assigneeId: issue.assigneeId,
    });

    return issue;
  }

  /**
   * List issues with filtering, full-text search, and pagination
   */
  static async listIssues(filters: ListIssuesFilter) {
    const {
      projectId,
      status,
      priority,
      type,
      assigneeId,
      sprintId,
      search,
      page = 1,
      limit = 50,
    } = filters;

    const where: any = { projectId };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.type = type;
    if (assigneeId) where.assigneeId = assigneeId;
    if (sprintId) where.sprintId = sprintId;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        include: {
          assignee: {
            select: { id: true, name: true, avatar: true },
          },
          labels: {
            include: { label: true },
          },
          _count: { select: { comments: true, subtasks: true } },
        },
        orderBy: [{ status: "asc" }, { position: "asc" }],
        skip,
        take: limit,
      }),
      prisma.issue.count({ where }),
    ]);

    return {
      issues,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single issue with comments, subtasks, project and parent hierarchy
   */
  static async getIssueById(issueId: string) {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        reporter: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        labels: {
          include: { label: true },
        },
        sprint: true,
        comments: {
          include: {
            author: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        subtasks: {
          select: {
            id: true,
            number: true,
            title: true,
            status: true,
            priority: true,
            assignee: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
        attachments: true,
        parent: {
          select: { id: true, number: true, title: true },
        },
        project: {
          select: { id: true, name: true, key: true },
        },
      },
    });

    if (!issue) {
      throw createError("Issue not found", 404);
    }

    return issue;
  }

  /**
   * Update issue fields, labels, and track audit logs
   */
  static async updateIssue(userId: string, issueId: string, updateData: any) {
    const oldIssue = await prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!oldIssue) {
      throw createError("Issue not found", 404);
    }

    const { labelIds, ...issueData } = updateData;

    const issue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        ...issueData,
        ...(issueData.dueDate && {
          dueDate: new Date(issueData.dueDate),
        }),
      },
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
        labels: {
          include: { label: true },
        },
        _count: { select: { comments: true, subtasks: true } },
      },
    });

    if (labelIds) {
      await prisma.issueLabel.deleteMany({ where: { issueId } });
      await prisma.issueLabel.createMany({
        data: labelIds.map((labelId: string) => ({
          issueId,
          labelId,
        })),
      });
    }

    if (updateData.status && updateData.status !== oldIssue.status) {
      await prisma.auditLog.create({
        data: {
          action: "STATUS_CHANGED",
          entityType: "ISSUE",
          entityId: issueId,
          userId,
          metadata: JSON.stringify({
            from: oldIssue.status,
            to: updateData.status,
          }),
        },
      });

      eventBus.emitEvent("issue.status_changed", {
        issueId,
        projectId: oldIssue.projectId,
        userId,
        oldStatus: oldIssue.status,
        newStatus: updateData.status,
      });
    }

    return issue;
  }

  /**
   * Move issue position and column status on Kanban board
   */
  static async moveIssue(userId: string, issueId: string, status: string, position: number) {
    const oldIssue = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!oldIssue) {
      throw createError("Issue not found", 404);
    }

    const issue = await prisma.issue.update({
      where: { id: issueId },
      data: { status, position },
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
        labels: {
          include: { label: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "STATUS_CHANGED",
        entityType: "ISSUE",
        entityId: issueId,
        userId,
        metadata: JSON.stringify({ newStatus: status, newPosition: position }),
      },
    });

    eventBus.emitEvent("issue.status_changed", {
      issueId,
      projectId: oldIssue.projectId,
      userId,
      oldStatus: oldIssue.status,
      newStatus: status,
    });

    return issue;
  }

  /**
   * Delete issue
   */
  static async deleteIssue(issueId: string) {
    const existing = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!existing) {
      throw createError("Issue not found", 404);
    }

    await prisma.issue.delete({ where: { id: issueId } });
  }
}
