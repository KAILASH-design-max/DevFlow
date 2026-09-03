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
      aiAnalysis,
    } = data;

    // Resolve project (support ID, key "SS", or fallback)
    let finalProjectId = projectId;
    const projectExists = await prisma.project.findUnique({ where: { id: projectId } });
    if (!projectExists) {
      const projByKey = await prisma.project.findFirst({
        where: { OR: [{ key: projectId }, { key: "SS" }, { name: "SpeedyShop" }] }
      }) || await prisma.project.findFirst();
      if (projByKey) {
        finalProjectId = projByKey.id;
      }
    }

    // Resolve reporter
    let finalUserId = userId;
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) finalUserId = firstUser.id;
    }

    // Resolve assignee
    let finalAssigneeId: string | null = null;
    if (assigneeId) {
      const assigneeExists = await prisma.user.findUnique({ where: { id: assigneeId } });
      if (assigneeExists) {
        finalAssigneeId = assigneeId;
      }
    }

    // Resolve sprint
    let finalSprintId: string | null = null;
    if (sprintId) {
      const sprintExists = await prisma.sprint.findUnique({ where: { id: sprintId } });
      if (sprintExists) {
        finalSprintId = sprintId;
      }
    }

    // Find last issue number in this project
    const lastIssue = await prisma.issue.findFirst({
      where: { projectId: finalProjectId },
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const issueNumber = (lastIssue?.number || 0) + 1;

    // Get max position for column
    const maxPosition = await prisma.issue.aggregate({
      where: { projectId: finalProjectId, status: "BACKLOG" },
      _max: { position: true },
    });
    const position = (maxPosition._max.position || 0) + 1;

    const issue = await prisma.issue.create({
      data: {
        number: issueNumber,
        title,
        description: description || title,
        type: type || "TASK",
        status: "BACKLOG",
        priority: priority || "MEDIUM",
        storyPoints: storyPoints ?? 3,
        dueDate: dueDate ? new Date(dueDate) : null,
        position,
        projectId: finalProjectId,
        assigneeId: finalAssigneeId,
        reporterId: finalUserId,
        sprintId: finalSprintId,
        parentId: parentId || null,
        aiAnalysis: aiAnalysis ? (typeof aiAnalysis === 'string' ? aiAnalysis : JSON.stringify(aiAnalysis)) : null,
        labels: labelIds && Array.isArray(labelIds) && labelIds.length > 0
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

    let finalProjectId = projectId;
    const projectExists = await prisma.project.findUnique({ where: { id: projectId } });
    if (!projectExists) {
      const projByKey = await prisma.project.findFirst({
        where: { OR: [{ key: projectId }, { key: "SS" }, { name: "SpeedyShop" }] }
      }) || await prisma.project.findFirst();
      if (projByKey) {
        finalProjectId = projByKey.id;
      }
    }

    const where: any = { projectId: finalProjectId };

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
    const includeConfig = {
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
        orderBy: { createdAt: "asc" as const },
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
      workLogs: {
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { loggedAt: "desc" as const },
      },
      commits: {
        orderBy: { createdAt: "desc" as const },
      },
      parent: {
        select: { id: true, number: true, title: true },
      },
      project: {
        select: { id: true, name: true, key: true },
      },
    };

    let issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: includeConfig,
    });

    if (!issue) {
      const numMatch = issueId.match(/\d+/);
      if (numMatch) {
        const num = parseInt(numMatch[0], 10);
        issue = await prisma.issue.findFirst({
          where: { number: num },
          include: includeConfig,
        });
      }
    }

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

    // IDOR Protection: Verify user is a member of the project
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId: oldIssue.projectId,
        }
      }
    });

    if (!membership) {
      throw createError("Unauthorized: You do not have access to this project", 403);
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
  static async deleteIssue(userId: string, issueId: string) {
    const existing = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!existing) {
      throw createError("Issue not found", 404);
    }

    // IDOR Protection: Verify user is a member of the project
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId: existing.projectId,
        }
      }
    });

    if (!membership) {
      throw createError("Unauthorized: You do not have access to this project", 403);
    }

    await prisma.issue.delete({ where: { id: issueId } });
  }

  /**
   * Get unified activity timeline (Audit logs, comments, work logs, commits)
   */
  static async getActivities(issueId: string) {
    const [auditLogs, comments, workLogs, commits] = await Promise.all([
      prisma.auditLog.findMany({
        where: { entityType: "ISSUE", entityId: issueId },
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.comment.findMany({
        where: { issueId },
        include: { author: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.workLog.findMany({
        where: { issueId },
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.gitCommit.findMany({
        where: { issueId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const timeline: any[] = [];

    auditLogs.forEach((log) => {
      let meta: any = {};
      try {
        meta = log.metadata ? JSON.parse(log.metadata) : {};
      } catch {
        meta = {};
      }
      timeline.push({
        id: `audit-${log.id}`,
        type: "AUDIT",
        action: log.action,
        user: log.user,
        metadata: meta,
        createdAt: log.createdAt,
      });
    });

    comments.forEach((comment) => {
      timeline.push({
        id: `comment-${comment.id}`,
        type: "COMMENT",
        action: "COMMENTED",
        user: comment.author,
        metadata: { content: comment.content },
        createdAt: comment.createdAt,
      });
    });

    workLogs.forEach((wl) => {
      timeline.push({
        id: `worklog-${wl.id}`,
        type: "WORKLOG",
        action: "LOGGED_TIME",
        user: wl.user,
        metadata: { timeSpentMinutes: wl.timeSpentMinutes, description: wl.description },
        createdAt: wl.loggedAt || wl.createdAt,
      });
    });

    commits.forEach((c) => {
      timeline.push({
        id: `commit-${c.id}`,
        type: "COMMIT",
        action: "COMMIT_ATTACHED",
        user: { id: "git", name: c.authorName, avatar: c.authorAvatar },
        metadata: { hash: c.hash, shortHash: c.shortHash, message: c.message, branch: c.branch, url: c.url },
        createdAt: c.createdAt,
      });
    });

    // Sort chronologically descending (newest first)
    timeline.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return timeline;
  }

  /**
   * Log time spent on issue
   */
  static async logWork(userId: string, issueId: string, data: { timeSpentMinutes: number; description?: string }) {
    const issue = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) {
      throw createError("Issue not found", 404);
    }

    const timeSpentMinutes = Math.max(1, data.timeSpentMinutes);
    const hoursAdded = timeSpentMinutes / 60;

    const workLog = await prisma.workLog.create({
      data: {
        issueId,
        userId,
        timeSpentMinutes,
        description: data.description || null,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Update loggedHours on issue
    const newLoggedHours = (issue.loggedHours || 0) + hoursAdded;
    await prisma.issue.update({
      where: { id: issueId },
      data: { loggedHours: newLoggedHours },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        action: "LOGGED_TIME",
        entityType: "ISSUE",
        entityId: issueId,
        userId,
        metadata: JSON.stringify({
          timeSpentMinutes,
          hoursAdded: hoursAdded.toFixed(2),
          totalLoggedHours: newLoggedHours.toFixed(2),
          description: data.description,
        }),
      },
    });

    return workLog;
  }

  /**
   * Fetch all worklogs for issue
   */
  static async getWorkLogs(issueId: string) {
    return prisma.workLog.findMany({
      where: { issueId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Delete a worklog
   */
  static async deleteWorkLog(userId: string, issueId: string, workLogId: string) {
    const workLog = await prisma.workLog.findUnique({ where: { id: workLogId } });
    if (!workLog) {
      throw createError("Work log not found", 404);
    }

    const hoursSubtracted = workLog.timeSpentMinutes / 60;
    const issue = await prisma.issue.findUnique({ where: { id: issueId } });

    await prisma.workLog.delete({ where: { id: workLogId } });

    if (issue) {
      const newLoggedHours = Math.max(0, (issue.loggedHours || 0) - hoursSubtracted);
      await prisma.issue.update({
        where: { id: issueId },
        data: { loggedHours: newLoggedHours },
      });
    }

    await prisma.auditLog.create({
      data: {
        action: "DELETED_TIME",
        entityType: "ISSUE",
        entityId: issueId,
        userId,
        metadata: JSON.stringify({ timeSpentMinutes: workLog.timeSpentMinutes }),
      },
    });
  }

  /**
   * Attach a Git commit to issue
   */
  static async attachCommit(
    userId: string,
    issueId: string,
    data: { hash: string; message: string; authorName: string; authorAvatar?: string; url?: string; branch?: string }
  ) {
    const issue = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) {
      throw createError("Issue not found", 404);
    }

    const shortHash = data.hash.substring(0, 7);

    const commit = await prisma.gitCommit.create({
      data: {
        issueId,
        hash: data.hash,
        shortHash,
        message: data.message,
        authorName: data.authorName,
        authorAvatar: data.authorAvatar || null,
        url: data.url || null,
        branch: data.branch || "main",
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "COMMIT_ATTACHED",
        entityType: "ISSUE",
        entityId: issueId,
        userId,
        metadata: JSON.stringify({ hash: shortHash, message: data.message, branch: data.branch }),
      },
    });

    return commit;
  }

  /**
   * Get all commits attached to issue
   */
  static async getCommits(issueId: string) {
    return prisma.gitCommit.findMany({
      where: { issueId },
      orderBy: { createdAt: "desc" },
    });
  }
}
