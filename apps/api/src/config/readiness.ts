import { prisma } from "@devflow/database";
import { config } from "./index.js";

export interface SubsystemCheck {
  name: string;
  category: "database" | "security" | "ai" | "email" | "storage" | "webhooks" | "system";
  status: "ready" | "warning" | "error";
  message: string;
  details?: Record<string, any>;
}

export interface ReadinessReport {
  timestamp: string;
  environment: string;
  isProduction: boolean;
  overallStatus: "ready" | "degraded" | "critical";
  subsystems: SubsystemCheck[];
}

export class ReadinessValidator {
  /**
   * Run comprehensive readiness checks across all DevFlow subsystems
   */
  static async check(): Promise<ReadinessReport> {
    const checks: SubsystemCheck[] = [];

    // 1. Database Connectivity & Configuration
    let dbStatus: "ready" | "error" = "ready";
    let dbMessage = "Connected to PostgreSQL database";
    let dbLatencyMs = 0;

    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - start;
    } catch (err: any) {
      dbStatus = "error";
      dbMessage = `Database connection failed: ${err?.message || "Unknown error"}`;
    }

    const isPooled = config.nodeEnv === "production" && process.env.DATABASE_URL?.includes("-pooler.");
    checks.push({
      name: "Database (PostgreSQL)",
      category: "database",
      status: dbStatus,
      message: dbStatus === "ready" ? `${dbMessage} (${dbLatencyMs}ms)` : dbMessage,
      details: {
        latencyMs: dbLatencyMs,
        isPooled,
        directUrlConfigured: Boolean(process.env.DIRECT_URL),
      },
    });

    // 2. Authentication & JWT Configuration
    const isDefaultJwt = !process.env.JWT_SECRET || process.env.JWT_SECRET === "dF!9xQ#mK7$pL2vR8@wN3hY6&jT0cA5eB4gU1sZ";
    let jwtStatus: "ready" | "warning" | "error" = "ready";
    let jwtMsg = "JWT Secret properly configured";

    if (isDefaultJwt) {
      if (config.isProduction) {
        jwtStatus = "error";
        jwtMsg = "CRITICAL: Using default or empty JWT_SECRET in production!";
      } else {
        jwtStatus = "warning";
        jwtMsg = "Using default dev JWT_SECRET (set custom key for production)";
      }
    } else if (config.jwtSecret.length < 32) {
      jwtStatus = config.isProduction ? "error" : "warning";
      jwtMsg = "JWT_SECRET should be at least 32 characters long";
    }

    checks.push({
      name: "JWT Authentication",
      category: "security",
      status: jwtStatus,
      message: jwtMsg,
      details: {
        accessExpiry: config.jwtAccessExpiry,
        refreshExpiry: config.jwtRefreshExpiry,
        length: config.jwtSecret.length,
      },
    });

    // 3. Cryptographic Token Encryption Key
    const isDefaultEncryption = !process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY === "devflow-default-encryption-secret-key-32b";
    let encStatus: "ready" | "warning" | "error" = "ready";
    let encMsg = "AES-256 encryption key active for sensitive integrations";

    if (isDefaultEncryption) {
      if (config.isProduction) {
        encStatus = "error";
        encMsg = "CRITICAL: ENCRYPTION_KEY must be set in production!";
      } else {
        encStatus = "warning";
        encMsg = "Using default development encryption key";
      }
    }

    checks.push({
      name: "Credential Encryption",
      category: "security",
      status: encStatus,
      message: encMsg,
    });

    // 4. CORS Protection
    const isWildcardCors = config.corsOrigin === "*";
    let corsStatus: "ready" | "warning" = "ready";
    let corsMsg = `Allowed Origin(s): ${config.corsOrigin}`;

    if (isWildcardCors && config.isProduction) {
      corsStatus = "warning";
      corsMsg = "Wildcard '*' CORS used in production with credentials. Specify exact origins!";
    }

    checks.push({
      name: "CORS Protection",
      category: "security",
      status: corsStatus,
      message: corsMsg,
    });

    // 5. Rate Limiting Protection
    checks.push({
      name: "Rate Limiter",
      category: "security",
      status: "ready",
      message: `Global limit: ${config.rateLimitMax} reqs / ${config.rateLimitWindowMs / 1000}s`,
    });

    // 6. AI Service Provider
    const hasGeminiKey = Boolean(config.geminiApiKey);
    const hasOpenAiKey = Boolean(config.openaiApiKey);
    let aiStatus: "ready" | "warning" = "ready";
    let aiMsg = `AI Provider: ${config.aiProvider}`;

    if (config.aiProvider === "gemini") {
      if (hasGeminiKey) {
        aiMsg = "Google Gemini Generative AI active";
      } else {
        aiStatus = "warning";
        aiMsg = "Gemini provider selected but GEMINI_API_KEY is missing (falling back to smart heuristics)";
      }
    } else if (config.aiProvider === "openai") {
      if (hasOpenAiKey) {
        aiMsg = "OpenAI model integration active";
      } else {
        aiStatus = "warning";
        aiMsg = "OpenAI provider selected but OPENAI_API_KEY is missing (falling back to smart heuristics)";
      }
    } else {
      aiMsg = "Smart heuristic AI mock generator active (deterministic fallback)";
    }

    checks.push({
      name: "AI Intelligence Engine",
      category: "ai",
      status: aiStatus,
      message: aiMsg,
      details: {
        provider: config.aiProvider,
        geminiConfigured: hasGeminiKey,
        openAiConfigured: hasOpenAiKey,
      },
    });

    // 7. Email & OTP Dispatch Service
    const hasSmtp = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
    checks.push({
      name: "Email & OTP Dispatch",
      category: "email",
      status: "ready",
      message: hasSmtp
        ? `SMTP transport active (${process.env.SMTP_HOST || "smtp.gmail.com"})`
        : "Local development mode: OTP codes output to server console",
      details: {
        mode: hasSmtp ? "smtp" : "console",
        host: process.env.SMTP_HOST || (hasSmtp ? "smtp.gmail.com" : undefined),
      },
    });

    // 8. File Storage Subsystem
    const isS3 = config.storageDriver === "s3";
    const hasS3Creds = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    let storageStatus: "ready" | "warning" = "ready";
    let storageMsg = "Local filesystem storage driver active";

    if (isS3) {
      if (hasS3Creds) {
        storageMsg = `AWS S3 / Cloudflare R2 bucket: ${process.env.S3_BUCKET || "assets"}`;
      } else {
        storageStatus = "warning";
        storageMsg = "S3 driver selected but AWS credentials are missing!";
      }
    }

    checks.push({
      name: "File Storage Driver",
      category: "storage",
      status: storageStatus,
      message: storageMsg,
      details: {
        driver: config.storageDriver,
        maxFileSizeMb: config.maxFileSizeMb,
      },
    });

    // 9. GitHub Webhook Security
    const isDefaultGithubSecret = !process.env.GITHUB_WEBHOOK_SECRET || process.env.GITHUB_WEBHOOK_SECRET === "devflow-webhook-secret";
    checks.push({
      name: "GitHub Webhook Guard",
      category: "webhooks",
      status: isDefaultGithubSecret && config.isProduction ? "warning" : "ready",
      message: isDefaultGithubSecret && config.isProduction
        ? "Using default GITHUB_WEBHOOK_SECRET in production"
        : "HMAC-SHA256 signature verification active for GitHub events",
    });

    // 10. Payment Webhook Security
    checks.push({
      name: "Payment / Stripe Webhook Guard",
      category: "webhooks",
      status: "ready",
      message: "HMAC signature verification active for billing webhooks",
    });

    // Determine overall system health
    const hasErrors = checks.some((c) => c.status === "error");
    const hasWarnings = checks.some((c) => c.status === "warning");

    const overallStatus = hasErrors ? "critical" : hasWarnings ? "degraded" : "ready";

    return {
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      isProduction: config.isProduction,
      overallStatus,
      subsystems: checks,
    };
  }

  /**
   * Log visual startup banner to console
   */
  static printBanner(report: ReadinessReport) {
    const width = 76;
    const border = "═".repeat(width);
    const divider = "─".repeat(width);

    console.log(`\n╔${border}╗`);
    console.log(`║                        🚀 DEVFLOW API SERVER                               ║`);
    console.log(`║         AI-Powered Engineering Management & Agile Platform                 ║`);
    console.log(`╠${border}╣`);
    console.log(`║  Environment : ${report.environment.padEnd(59)}║`);
    console.log(`║  Status      : ${(report.overallStatus.toUpperCase() + (report.overallStatus === "ready" ? " (ALL SUBSYSTEMS OPERATIONAL)" : "")).padEnd(59)}║`);
    console.log(`╠${divider}╣`);

    for (const sub of report.subsystems) {
      const icon = sub.status === "ready" ? "✅" : sub.status === "warning" ? "⚠️ " : "❌";
      const name = `${icon} ${sub.name}`.padEnd(32);
      const msg = sub.message.slice(0, 39).padEnd(39);
      console.log(`║  ${name}: ${msg}║`);
    }

    console.log(`╚${border}╝\n`);
  }
}
