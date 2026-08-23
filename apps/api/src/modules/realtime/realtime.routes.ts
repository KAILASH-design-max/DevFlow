import { Router, Request, Response } from "express";
import crypto from "crypto";
import { RealtimeService } from "./realtime.service.js";

export const realtimeRouter = Router();

// ─── Real-Time SSE Stream Endpoint ──────────────
realtimeRouter.get("/events", (req: Request, res: Response) => {
  const clientId = crypto.randomUUID();
  const projectId = req.query.projectId as string | undefined;
  const userId = req.query.userId as string | undefined;

  // Set SSE response headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  // Prevent connection buffering in Express
  res.flushHeaders?.();

  // Register client
  RealtimeService.addClient(clientId, res, projectId, userId);

  // Clean up on disconnect
  req.on("close", () => {
    RealtimeService.removeClient(clientId);
  });
});

// ─── Connection Stats ────────────────────────────
realtimeRouter.get("/stats", (_req: Request, res: Response) => {
  res.json({ success: true, data: RealtimeService.getStats() });
});
