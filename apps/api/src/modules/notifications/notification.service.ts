import { prisma } from "@devflow/database";
import { eventBus } from "../../services/eventEmitter.js";
import { RealtimeService } from "../realtime/realtime.service.js";

// In-memory preferences fallback store removed, using Prisma instead

export class NotificationService {
  /**
   * List notifications for user with category filtering & pagination
   */
  static async getUserNotifications(
    userId: string,
    options?: {
      category?: string;
      unreadOnly?: boolean;
      page?: number;
      limit?: number;
    }
  ) {
    const { category = "all", unreadOnly = false, page = 1, limit = 50 } = options || {};

    const where: any = { userId };

    if (unreadOnly || category === "unread") {
      where.isRead = false;
    }

    if (category === "assignments") {
      where.type = { in: ["ISSUE_ASSIGNED", "ASSIGNMENT"] };
    } else if (category === "mentions") {
      where.type = { in: ["MENTIONED", "MENTION"] };
    } else if (category === "prs") {
      where.type = { in: ["PULL_REQUEST", "PR_MERGED", "PR_OPENED"] };
    } else if (category === "system") {
      where.type = { in: ["SYSTEM", "SPRINT_STARTED", "SPRINT_COMPLETED", "SLA_BREACH"] };
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get unread notification count for user
   */
  static async getUnreadCount(userId: string) {
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount };
  }

  /**
   * Mark single notification as read
   */
  static async markAsRead(notificationId: string) {
    const notif = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: notif.userId, isRead: false },
    });

    RealtimeService.broadcastNotification(notif.userId, {
      type: "NOTIFICATION_READ",
      notificationId: notif.id,
      unreadCount,
    });

    return notif;
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    RealtimeService.broadcastNotification(userId, {
      type: "ALL_NOTIFICATIONS_READ",
      unreadCount: 0,
    });

    return { success: true };
  }

  /**
   * Delete a single notification
   */
  static async deleteNotification(notificationId: string) {
    return prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Clear all read notifications for user
   */
  static async clearAllRead(userId: string) {
    return prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });
  }

  /**
   * Get user notification preferences
   */
  static async getPreferences(userId: string) {
    try {
      const prefs = await prisma.notificationSetting.findUnique({
        where: { userId },
      });
      
      if (prefs) return prefs;

      // Check if user exists in database first
      const userExists = await prisma.user.findUnique({ where: { id: userId } });
      if (!userExists) {
        return {
          userId,
          emailAssignments: true,
          emailMentions: true,
          emailPrUpdates: true,
          emailSprintAlerts: true,
          emailSecurityAlerts: true,
          inAppSound: true,
          desktopNotifications: true,
        };
      }

      return await prisma.notificationSetting.create({
        data: { userId },
      });
    } catch {
      return {
        userId,
        emailAssignments: true,
        emailMentions: true,
        emailPrUpdates: true,
        emailSprintAlerts: true,
        emailSecurityAlerts: true,
        inAppSound: true,
        desktopNotifications: true,
      };
    }
  }

  /**
   * Update user notification preferences
   */
  static async updatePreferences(userId: string, prefs: any) {
    try {
      const userExists = await prisma.user.findUnique({ where: { id: userId } });
      if (!userExists) {
        return { userId, ...prefs };
      }
      return await prisma.notificationSetting.upsert({
        where: { userId },
        create: { userId, ...prefs },
        update: prefs,
      });
    } catch {
      return { userId, ...prefs };
    }
  }

  /**
   * Create notification and dispatch real-time SSE update
   */
  static async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    linkUrl?: string;
  }) {
    const notif = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        linkUrl: data.linkUrl,
      },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: data.userId, isRead: false },
    });

    RealtimeService.broadcastNotification(data.userId, {
      type: "NEW_NOTIFICATION",
      notification: notif,
      unreadCount,
    });

    return notif;
  }

  /**
   * Initialize event subscribers for automated background notification dispatch
   */
  static initEventSubscribers() {
    eventBus.onEvent("issue.created", async (event) => {
      if (event.assigneeId && event.assigneeId !== event.userId) {
        try {
          await this.createNotification({
            userId: event.assigneeId,
            type: "ISSUE_ASSIGNED",
            title: "New Issue Assigned",
            message: `You were assigned to issue: ${event.title}`,
            linkUrl: `/dashboard/issues/${event.issueId}`,
          });
        } catch (e) {
          console.error("Failed to dispatch issue.created notification:", e);
        }
      }
    });

    eventBus.onEvent("sprint.started", async (event) => {
      try {
        const members = await prisma.projectMember.findMany({
          where: { projectId: event.projectId },
          select: { userId: true },
        });

        for (const m of members) {
          if (m.userId !== event.userId) {
            await this.createNotification({
              userId: m.userId,
              type: "SPRINT_STARTED",
              title: "Sprint Started",
              message: `Sprint "${event.name}" has been activated.`,
              linkUrl: "/dashboard/board",
            });
          }
        }
      } catch (e) {
        console.error("Failed to dispatch sprint.started notification:", e);
      }
    });
  }
}

// Auto-initialize subscribers
NotificationService.initEventSubscribers();

