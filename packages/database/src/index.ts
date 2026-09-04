import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

// Ensure DATABASE_URL and DIRECT_URL are populated from .env or fallback
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
  dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
  dotenv.config();
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/devflow?schema=public";
}

if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Creates and configures the singleton Prisma Client instance for Neon PostgreSQL.
 * Uses safe log levels and connection pooling defaults.
 */
function createPrismaClient(): PrismaClient {
  const isProd = (globalThis as any).process?.env?.NODE_ENV === "production";
  const datasourceUrl =
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/devflow?schema=public";
  
  const client = new PrismaClient({
    datasourceUrl,
    log: isProd ? ["error"] : ["error", "warn"],
    errorFormat: isProd ? "minimal" : "pretty",
  });

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          return withPrismaRetry(() => query(args), 3, 500);
        },
      },
    },
  }) as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if ((globalThis as any).process?.env?.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Graceful cleanup handlers
const cleanUpPrisma = async () => {
  try {
    await prisma.$disconnect();
  } catch (err) {
    // Suppress logging of connection details during shutdown
  }
};

const proc = (globalThis as any).process;
if (proc && typeof proc.on === "function") {
  proc.on("beforeExit", cleanUpPrisma);
}

// Transient Prisma & connection error codes for bounded retries
const TRANSIENT_PRISMA_ERRORS = new Set([
  "P1001", // Can't reach database server
  "P1002", // Database server timed out
  "P1008", // Operations timed out
  "P1017", // Server closed connection
  "ECONNRESET",
  "ETIMEDOUT",
  "EPIPE",
]);

/**
 * Execute a database operation with bounded exponential backoff and jitter
 * strictly for known transient socket/connection errors.
 */
export async function withPrismaRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 200
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      const isTransient =
        TRANSIENT_PRISMA_ERRORS.has(error?.code) ||
        (typeof error?.message === "string" &&
          (error.message.includes("Connection terminated") ||
            error.message.includes("socket closed") ||
            error.message.includes("Can't reach database server")));

      if (!isTransient || attempt >= maxRetries) {
        throw error;
      }

      const jitter = Math.random() * 100;
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1) + jitter, 2000);
      await new Promise((resolve) => (globalThis as any).setTimeout(resolve, delay));
    }
  }
}

export * from "@prisma/client";
export default prisma;
