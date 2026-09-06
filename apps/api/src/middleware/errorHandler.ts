import { Request, Response, NextFunction } from "express";
import { config } from "../config/index.js";

export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export function createError(
  message: string,
  statusCode: number = 500
): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const requestId = req.headers["x-request-id"] || "unknown";

  // Only show detailed errors for operational (expected) errors
  // Never leak internal details in production
  let message: string;
  if (err.isOperational) {
    message = err.message;
  } else if (config.nodeEnv === "development") {
    message = err.message;
  } else {
    message = "An unexpected error occurred. Please try again later.";
  }

  // Security sanitization: Strip internal infrastructure, database URIs, hostnames, or paths
  if (
    message.includes("postgresql://") ||
    message.includes("neon.tech") ||
    message.includes("PrismaClient") ||
    message.includes("prisma.") ||
    /([a-zA-Z]:\\|\/home\/|\/app\/)/.test(message)
  ) {
    message = "A database or system error occurred. Please try again later.";
  }

  // Log server errors with full context (but never send to client)
  if (statusCode >= 500) {
    console.error(`❌ [${requestId}] Internal Error:`, {
      message: err.message,
      stack: config.nodeEnv === "development" ? err.stack : undefined,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    requestId,
    // Only include stack in development mode for debugging
    ...(config.nodeEnv === "development" && statusCode >= 500 && { stack: err.stack }),
  });
}
