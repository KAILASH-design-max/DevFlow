import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config({ path: "../../.env" });

// Generate a secure fallback JWT secret at startup (never use a hardcoded default)
const secureFallback = crypto.randomBytes(64).toString("hex");

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  // JWT — uses env var or a one-time random secret (safe for dev, forces env config in prod)
  jwtSecret: process.env.JWT_SECRET || secureFallback,
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || "15m",
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
  jwtIssuer: "devflow-api",
  jwtAudience: "devflow-web",

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),

  // AI
  aiProvider: process.env.AI_PROVIDER || "mock", // "gemini" | "openai" | "mock"
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  openaiApiKey: process.env.OPENAI_API_KEY || "",

  // GitHub Integration & Encryption
  githubClientId: process.env.GITHUB_CLIENT_ID || "",
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || "",
  githubCallbackUrl: process.env.GITHUB_CALLBACK_URL || "http://localhost:4000/api/github/oauth/callback",
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET || "devflow-webhook-secret",
  encryptionKey: process.env.ENCRYPTION_KEY || "devflow-default-encryption-secret-key-32b",

  // Storage & Attachments
  storageDriver: process.env.STORAGE_DRIVER || "local", // "local" | "s3"
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || "10", 10),
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:4000",
} as const;

// Warn in production if JWT_SECRET is not explicitly set
if (config.nodeEnv === "production" && !process.env.JWT_SECRET) {
  console.warn(
    "⚠️  WARNING: JWT_SECRET is not set in environment. Using a random secret — tokens will not persist across restarts."
  );
}
