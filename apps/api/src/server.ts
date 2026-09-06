import dns from "node:dns";
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

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
import { billingRouter } from "./modules/billing/billing.routes.js";
import { deploymentRoutes } from "./modules/deployments/deployment.routes.js";
import path from "path";
import crypto from "crypto";
import { StorageService } from "./services/storage.service.js";
import { prisma } from "@devflow/database";
import { idempotencyMiddleware } from "./middleware/idempotency.js";

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
  }) as any
);

// ─────────────────────────────────────────────
// CORS (Strict, supporting comma-separated multi-domain lists & Vercel deployments)
// ─────────────────────────────────────────────

const parsedCorsOrigins = config.corsOrigin
  ? config.corsOrigin.split(",").map((o) => o.trim()).filter(Boolean)
  : ["http://localhost:3000"];

const corsOptions: cors.CorsOptions = {
  origin: (requestOrigin, callback) => {
    // 1. Allow non-browser / server-to-server / healthcheck / curl requests with no origin
    if (!requestOrigin) return callback(null, true);

    // 2. If wildcard '*' is configured, reflect the origin so Access-Control-Allow-Credentials works
    if (parsedCorsOrigins.includes("*")) {
      return callback(null, true);
    }

    // 3. Check exact matches from CORS_ORIGIN
    if (parsedCorsOrigins.includes(requestOrigin)) {
      return callback(null, true);
    }

    // 4. Automatically allow all Vercel deployments (production, branch preview, PR preview)
    try {
      const url = new URL(requestOrigin);
      if (url.hostname.endsWith(".vercel.app") || url.hostname === "localhost" || url.hostname === "127.0.0.1") {
        return callback(null, true);
      }
    } catch {
      // invalid origin URL string
    }

    // 5. Deny origin
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  exposedHeaders: ["X-Request-ID", "X-RateLimit-Remaining"],
  maxAge: 600, // 10 minutes preflight cache
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ─────────────────────────────────────────────
// Body Parsing & Cookies
// ─────────────────────────────────────────────

// Raw body for GitHub & Stripe payment webhook HMAC verification (must come BEFORE json parser)
app.use("/api/github/webhook", express.raw({ type: "application/json" }));
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(cookieParser());
app.use(idempotencyMiddleware);

// ─────────────────────────────────────────────
// Request ID & Logging
// ─────────────────────────────────────────────

app.use((req, _res, next) => {
  req.headers["x-request-id"] =
    req.headers["x-request-id"] || crypto.randomUUID();
  next();
});

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
  max: config.nodeEnv === "production" ? 10 : 1000, // relaxed for test suites
  skip: (req) => config.nodeEnv !== "production" && (req.ip === "127.0.0.1" || req.ip === "::1" || req.ip === "::ffff:127.0.0.1"),
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
// Health Check (Safe production health probes)
// ─────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/health", async (_req, res) => {
  let dbStatus = "connected";
  let isHealthy = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    dbStatus = "disconnected";
    isHealthy = false;
  }

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    message: isHealthy ? "DevFlow API is running" : "DevFlow API database disconnected",
    database: dbStatus,
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    uptime: Math.floor(process.uptime()),
  });
});

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "DevFlow REST API Server",
    status: "ok",
    healthCheck: "/health",
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
app.use("/api/billing", billingRouter);
app.use("/api", deploymentRoutes);

// ─────────────────────────────────────────────
// Static Uploads Serving
// ─────────────────────────────────────────────

app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), config.uploadDir), {
    maxAge: "7d",
    setHeaders: (res, filePath) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("X-Content-Type-Options", "nosniff");
      // Prevent inline script execution for uploaded SVGs or HTML files
      const lower = filePath.toLowerCase();
      if (lower.endsWith(".svg") || lower.endsWith(".html") || lower.endsWith(".htm")) {
        res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'");
        res.setHeader("Content-Disposition", "attachment");
      }
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
// Start Server & Lifecycle
// ─────────────────────────────────────────────

if (!process.env.VERCEL) {
  const listenPort = process.env.PORT ? parseInt(process.env.PORT, 10) : config.port;
  const server = app.listen(listenPort, "0.0.0.0", () => {
    console.log(`
  ╔═══════════════════════════════════════════╗
  ║     🚀 DevFlow API Server Running        ║
  ║     Host: 0.0.0.0                         ║
  ║     Port: ${String(listenPort).padEnd(28)}║
  ║     Env:  ${config.nodeEnv.padEnd(28)}║
  ║     CORS: ${config.corsOrigin.padEnd(28)}║
  ║     Rate: ${String(config.rateLimitMax + " req/" + config.rateLimitWindowMs / 1000 + "s").padEnd(28)}║
  ╚═══════════════════════════════════════════╝
    `);
  });

  const gracefulShutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Gracefully shutting down DevFlow API...`);
    server.close(async () => {
      try {
        await prisma.$disconnect();
        console.log("Prisma client disconnected successfully.");
      } catch (err) {
        // Suppress connection details in logs
      }
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

export default app;
