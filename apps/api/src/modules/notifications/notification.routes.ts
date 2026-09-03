import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth.js";
import { NotificationService } from "./notification.service.js";
import { verifyNotificationOwnership } from "../../middleware/authorizationHelpers.js";

export const notificationRouter = Router();

notificationRouter.use(authenticate);

// ─── List Notifications ─────────────────────────
notificationRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category, unreadOnly, page, limit } = req.query;
      const result = await NotificationService.getUserNotifications(
        req.user!.userId,
        {
          category: category as string | undefined,
          unreadOnly: unreadOnly === "true",
          page: page ? parseInt(page as string, 10) : 1,
          limit: limit ? parseInt(limit as string, 10) : 50,
        }
      );

      res.json({
        success: true,
        data: result.notifications,
        unreadCount: result.unreadCount,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Get Unread Count ───────────────────────────
notificationRouter.get(
  "/unread-count",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await NotificationService.getUnreadCount(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Get Notification Preferences ───────────────
notificationRouter.get(
  "/preferences",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const preferences = await NotificationService.getPreferences(req.user!.userId);
      res.json({ success: true, data: preferences });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Update Notification Preferences ────────────
notificationRouter.put(
  "/preferences",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const preferences = await NotificationService.updatePreferences(
        req.user!.userId,
        req.body
      );
      res.json({ success: true, data: preferences });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Mark as Read ───────────────────────────────
notificationRouter.patch(
  "/:notificationId/read",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notificationId = req.params.notificationId as string;
      await verifyNotificationOwnership(req.user!.userId, notificationId);
      await NotificationService.markAsRead(notificationId);
      res.json({ success: true, message: "Marked as read" });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Mark All as Read ───────────────────────────
notificationRouter.patch(
  "/read-all",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await NotificationService.markAllAsRead(req.user!.userId);
      res.json({ success: true, message: "All marked as read" });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Delete Single Notification ─────────────────
notificationRouter.delete(
  "/:notificationId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notificationId = req.params.notificationId as string;
      await verifyNotificationOwnership(req.user!.userId, notificationId);
      await NotificationService.deleteNotification(notificationId);
      res.json({ success: true, message: "Notification deleted" });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Clear All Read Notifications ───────────────
notificationRouter.delete(
  "/clear-all/read",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await NotificationService.clearAllRead(req.user!.userId);
      res.json({ success: true, message: "Read notifications cleared" });
    } catch (error) {
      next(error);
    }
  }
);

