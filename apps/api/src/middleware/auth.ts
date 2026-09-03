import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { prisma } from "@devflow/database";
import { createError } from "./errorHandler.js";
import type { JwtPayload } from "@devflow/shared";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

import { adminAuth } from "../config/firebaseAdmin.js";

/**
 * Middleware: Verify Firebase ID token or fallback JWT access token
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw createError("Authentication required", 401);
    }

    const token = authHeader.split(" ")[1];

    // 1. Try Firebase ID Token first
    try {
      const decodedFirebase = await adminAuth.verifyIdToken(token);
      let dbUserId = decodedFirebase.uid;
      
      if (decodedFirebase.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: decodedFirebase.email } });
        if (dbUser) {
          dbUserId = dbUser.id;
        }
      }

      req.user = {
        userId: dbUserId,
        email: decodedFirebase.email || "",
      };
      return next();
    } catch {
      // Token not a Firebase token or Firebase verification failed, try internal JWT
    }

    // 2. Internal JWT verification
    const decoded = jwt.verify(token, config.jwtSecret, {
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    }) as JwtPayload;

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(createError("Token expired", 401));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(createError("Invalid token or signature", 401));
    } else {
      next(error);
    }
  }
}

/**
 * Middleware: Check if user has required role in a workspace
 */
export function authorizeWorkspace(...allowedRoles: string[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createError("Authentication required", 401);
      }

      const workspaceId =
        req.params.workspaceId || req.body.workspaceId || (req.query.workspaceId as string);

      if (!workspaceId) {
        throw createError("Workspace ID is required", 400);
      }

      const member = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: req.user.userId,
            workspaceId,
          },
        },
      });

      if (!member) {
        throw createError("Not a member of this workspace", 403);
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(member.role)) {
        throw createError(
          `Insufficient permissions. Required: ${allowedRoles.join(", ")}`,
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware: Check if user has required role in a project
 */
export function authorizeProject(...allowedRoles: string[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createError("Authentication required", 401);
      }

      const projectId = req.params.projectId || req.body.projectId || (req.query.projectId as string);

      if (!projectId) {
        throw createError("Project ID is required", 400);
      }

      const member = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: req.user.userId,
            projectId,
          },
        },
      });

      if (!member) {
        throw createError("Not a member of this project", 403);
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(member.role)) {
        throw createError(
          `Insufficient permissions. Required: ${allowedRoles.join(", ")}`,
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
