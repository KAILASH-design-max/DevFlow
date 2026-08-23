import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth.js";
import { NotificationService } from "./notification.service.js";

export const notificationRouter = Router();

notificationRouter.use(authenticate);

// ─── List Notifications ─────────────────────────
notificationRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unreadOnly = req.query.unreadOnly === "true";
      const result = await NotificationService.getUserNotifications(
        req.user!.userId,
        unreadOnly
      );

      res.json({
        success: true,
        data: result,
      });
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
      await NotificationService.markAsRead(
        req.params.notificationId as string
      );
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
