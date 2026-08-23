import { prisma } from "@devflow/database";
import { eventBus } from "../../services/eventEmitter.js";

export class NotificationService {
  /**
   * List notifications for user
   */
  static async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return { notifications, unreadCount };
  }

  /**
   * Mark single notification as read
   */
  static async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Create notification
   */
  static async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    linkUrl?: string;
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        linkUrl: data.linkUrl,
      },
    });
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
        // Find project members to notify
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
