import dotenv from "dotenv";
import crypto from "crypto";
import path from "path";

// Load .env reliably from current working directory or monorepo root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config();

if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("🚨 CRITICAL SECURITY CONFIGURATION ERROR: DATABASE_URL must be explicitly configured in production!");
  }
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/devflow?schema=public";
}

if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

const stableDevSecret = process.env.JWT_SECRET || "dF!9xQ#mK7$pL2vR8@wN3hY6&jT0cA5eB4gU1sZ";

export const config = {
  // Existing fields …
  // Signing secret for temporary URLs (must be set in production)
  urlSigningSecret: process.env.URL_SIGNING_SECRET || undefined,

  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",

  // JWT — uses env var or stable development key
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? crypto.randomBytes(64).toString("hex") : stableDevSecret),
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || "15m",
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
  otpHashSecret: process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || "devflow-otp-hash-secret-hmac-32b",
  jwtIssuer: "devflow-api",
  jwtAudience: "devflow-web",

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || (process.env.NODE_ENV === "production" ? "100" : "1000"), 10),

  // AI
  aiProvider: process.env.AI_PROVIDER || "mock", // "gemini" | "openai" | "mock"
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  openaiApiKey: process.env.OPENAI_API_KEY || "",

  // GitHub Integration & Encryption
  githubClientId: process.env.GITHUB_CLIENT_ID || "",
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || "",
  githubCallbackUrl: process.env.GITHUB_CALLBACK_URL || "http://localhost:4000/api/github/oauth/callback",
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET || "devflow-webhook-secret",
  paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "devflow-payment-webhook-secret",
  encryptionKey: process.env.ENCRYPTION_KEY || "devflow-default-encryption-secret-key-32b",

  // Storage & Attachments
  storageDriver: process.env.STORAGE_DRIVER || "local", // "local" | "s3"
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || "10", 10),
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:4000",

  // Neon Auth & Data API
  neonAuthUrl: process.env.NEON_AUTH_URL || "",
  neonApiUrl: process.env.NEON_API_URL || "",
} as const;

// Warn in production if JWT_SECRET is not explicitly set (fallback to stableDevSecret)
if (!process.env.JWT_SECRET) {
  console.warn(
    "⚠️  WARNING: JWT_SECRET is not set in environment. Using fallback secret — please set JWT_SECRET in your Vercel/production environment variables."
  );
}

if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY === "devflow-default-encryption-secret-key-32b") {
  console.warn(
    "⚠️  WARNING: ENCRYPTION_KEY is not set in environment. Using default encryption key."
  );
}

if (!process.env.GITHUB_WEBHOOK_SECRET || process.env.GITHUB_WEBHOOK_SECRET === "devflow-webhook-secret") {
  console.warn(
    "⚠️  WARNING: GITHUB_WEBHOOK_SECRET is not set in environment. Using default webhook secret."
  );
}
