import { Router, Request, Response } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { config } from "../../config/index.js";
import { RealtimeService } from "./realtime.service.js";
import { adminAuth } from "../../config/firebaseAdmin.js";
import { prisma } from "@devflow/database";
import { verifyProjectAccess } from "../../middleware/authorizationHelpers.js";
import { authenticate } from "../../middleware/auth.js";
import type { JwtPayload } from "@devflow/shared";

export const realtimeRouter = Router();

/**
 * Authenticate incoming SSE connection via Authorization header or ?token query param
 */
async function authenticateSse(req: Request): Promise<{ userId: string; email: string } | null> {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  } else if (req.query.token && typeof req.query.token === "string") {
    token = req.query.token;
  }

  if (!token) return null;

  // 1. Try Firebase ID token
  try {
    const decodedFirebase = await adminAuth.verifyIdToken(token);
    let dbUserId = decodedFirebase.uid;
    if (decodedFirebase.email) {
      const dbUser = await prisma.user.findUnique({ where: { email: decodedFirebase.email } });
      if (dbUser) dbUserId = dbUser.id;
    }
    return { userId: dbUserId, email: decodedFirebase.email || "" };
  } catch {
    // Fallback to internal JWT
  }

  // 2. Try internal JWT
  try {
    const decoded = jwt.verify(token, config.jwtSecret, {
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    }) as JwtPayload;
    return { userId: decoded.userId, email: decoded.email };
  } catch {
    return null;
  }
}

// ─── Real-Time SSE Stream Endpoint ──────────────
realtimeRouter.get("/events", async (req: Request, res: Response) => {
  const user = await authenticateSse(req);
  if (!user) {
    res.status(401).json({ success: false, error: "Authentication required for realtime event stream" });
    return;
  }

  const projectId = req.query.projectId as string | undefined;

  // If projectId is requested, verify user has access to it
  if (projectId) {
    try {
      await verifyProjectAccess(user.userId, projectId);
    } catch (err: any) {
      res.status(err.statusCode || 403).json({ success: false, error: err.message || "Forbidden" });
      return;
    }
  }

  const clientId = crypto.randomUUID();

  // Set SSE response headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  // Prevent connection buffering in Express
  res.flushHeaders?.();

  // Register client
  RealtimeService.addClient(clientId, res, projectId, user.userId);

  // Clean up on disconnect
  req.on("close", () => {
    RealtimeService.removeClient(clientId);
  });
});

// ─── Connection Stats ────────────────────────────
realtimeRouter.get("/stats", authenticate, (_req: Request, res: Response) => {
  res.json({ success: true, data: RealtimeService.getStats() });
});
