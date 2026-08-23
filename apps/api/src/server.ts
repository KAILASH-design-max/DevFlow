import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { config } from "./config/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { workspaceRouter } from "./modules/workspaces/workspace.routes.js";
import { projectRouter } from "./modules/projects/project.routes.js";
import { issueRouter } from "./modules/issues/issue.routes.js";
import { commentRouter } from "./modules/comments/comment.routes.js";
import { labelRouter } from "./modules/labels/label.routes.js";
import { sprintRouter } from "./modules/sprints/sprint.routes.js";
import { notificationRouter } from "./modules/notifications/notification.routes.js";
import { aiRouter } from "./modules/ai/ai.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { githubRouter } from "./modules/github/github.routes.js";
import { attachmentRouter } from "./modules/attachments/attachment.routes.js";
import { analyticsRouter } from "./modules/analytics/analytics.routes.js";
import { realtimeRouter } from "./modules/realtime/realtime.routes.js";
import path from "path";
import { StorageService } from "./services/storage.service.js";

const app = express();

// Initialize uploads directory
StorageService.init();

// ─────────────────────────────────────────────
// Trust Proxy (required for rate limiting behind reverse proxy)
// ─────────────────────────────────────────────

app.set("trust proxy", 1);

// ─────────────────────────────────────────────
// Security Headers (Helmet)
// ─────────────────────────────────────────────

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow cross-origin resources
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  })
);

// ─────────────────────────────────────────────
// CORS (Strict)
// ─────────────────────────────────────────────

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    exposedHeaders: ["X-Request-ID", "X-RateLimit-Remaining"],
    maxAge: 600, // 10 minutes preflight cache
  })
);

// ─────────────────────────────────────────────
// Body Parsing & Cookies
// ─────────────────────────────────────────────

// Raw body for GitHub webhook HMAC verification (must come BEFORE json parser)
app.use("/api/github/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(cookieParser());

// ─────────────────────────────────────────────
// Request ID & Logging
// ─────────────────────────────────────────────

app.use((req, _res, next) => {
  req.headers["x-request-id"] =
    req.headers["x-request-id"] || crypto.randomUUID();
  next();
});

import crypto from "crypto";

// Only use verbose logging in development
if (config.nodeEnv === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ─────────────────────────────────────────────
// Global Rate Limiter
// ─────────────────────────────────────────────

const globalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. Please try again later.",
  },
  keyGenerator: (req) => {
    return req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
  },
});

app.use("/api/", globalLimiter);

// ─────────────────────────────────────────────
// Auth Rate Limiter (strict)
// ─────────────────────────────────────────────

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many authentication attempts. Please try again in 15 minutes.",
  },
  keyGenerator: (req) => {
    return req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
  },
});

// ─────────────────────────────────────────────
// Health Check (excluded from rate limiting)
// ─────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "DevFlow API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    uptime: Math.floor(process.uptime()),
  });
});

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRouter);
app.use("/api/workspaces", workspaceRouter);
app.use("/api/projects", projectRouter);
app.use("/api/issues", issueRouter);
app.use("/api/comments", commentRouter);
app.use("/api/labels", labelRouter);
app.use("/api/sprints", sprintRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/ai", aiRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/github", githubRouter);
app.use("/api/attachments", attachmentRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/realtime", realtimeRouter);

// ─────────────────────────────────────────────
// Static Uploads Serving
// ─────────────────────────────────────────────

app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), config.uploadDir), {
    maxAge: "7d",
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

// ─────────────────────────────────────────────
// 404 Catch-All for Undefined API Routes
// ─────────────────────────────────────────────

app.use("/api/*", (_req, res) => {
  res.status(404).json({
    success: false,
    error: "API endpoint not found",
  });
});

// ─────────────────────────────────────────────
// Error Handling
// ─────────────────────────────────────────────

app.use(errorHandler);

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────

app.listen(config.port, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║     🚀 DevFlow API Server Running        ║
  ║     Port: ${config.port}                          ║
  ║     Env:  ${config.nodeEnv.padEnd(28)}║
  ║     CORS: ${config.corsOrigin.padEnd(28)}║
  ║     Rate: ${String(config.rateLimitMax + " req/" + config.rateLimitWindowMs / 1000 + "s").padEnd(28)}║
  ╚═══════════════════════════════════════════╝
  `);
});

export default app;
