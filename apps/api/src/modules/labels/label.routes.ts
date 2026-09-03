import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "@devflow/database";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createLabelSchema } from "@devflow/shared";
import { verifyProjectAccess } from "../../middleware/authorizationHelpers.js";

export const labelRouter = Router();

labelRouter.use(authenticate);

// ─── Create Label ───────────────────────────────
labelRouter.post(
  "/",
  validate(createLabelSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, color } = req.body;
      const projectId = req.query.projectId as string;

      if (!projectId) {
        res.status(400).json({ success: false, error: "projectId is required" });
        return;
      }
      await verifyProjectAccess(req.user!.userId, projectId);

      const label = await prisma.label.create({
        data: { name, color, projectId },
      });

      res.status(201).json({ success: true, data: label });
    } catch (error) {
      next(error);
    }
  }
);

// ─── List Labels ────────────────────────────────
labelRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.query.projectId as string;

      if (!projectId) {
        res.status(400).json({ success: false, error: "projectId is required" });
        return;
      }
      await verifyProjectAccess(req.user!.userId, projectId);

      const labels = await prisma.label.findMany({
        where: { projectId },
        include: { _count: { select: { issues: true } } },
        orderBy: { name: "asc" },
      });

      res.json({ success: true, data: labels });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Delete Label ───────────────────────────────
labelRouter.delete(
  "/:labelId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const labelId = req.params.labelId as string;
      const label = await prisma.label.findUnique({
        where: { id: labelId },
        select: { projectId: true },
      });
      if (!label) {
        res.status(404).json({ success: false, error: "Label not found" });
        return;
      }
      await verifyProjectAccess(req.user!.userId, label.projectId);

      await prisma.label.delete({ where: { id: labelId } });
      res.json({ success: true, message: "Label deleted" });
    } catch (error) {
      next(error);
    }
  }
);
