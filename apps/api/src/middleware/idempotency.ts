import { Request, Response, NextFunction } from "express";

interface IdempotentRecord {
  status: number;
  body: any;
  timestamp: number;
  inFlight?: boolean;
}

// In-memory cache for idempotency keys with TTL cleanup
const idempotencyCache = new Map<string, IdempotentRecord>();

// TTL: 5 minutes
const TTL_MS = 5 * 60 * 1000;

// Periodic cache cleanup
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of idempotencyCache.entries()) {
    if (now - record.timestamp > TTL_MS) {
      idempotencyCache.delete(key);
    }
  }
}, 60 * 1000);

if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

/**
 * Idempotency Middleware for Network Resilience
 * Prevents duplicate resource creations/mutations when weak or slow networks
 * cause clients to re-send requests with the same Idempotency-Key header.
 */
export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  if (method !== "POST" && method !== "PATCH" && method !== "DELETE" && method !== "PUT") {
    return next();
  }

  // Skip webhooks that have their own signature/dedup verification
  if (req.originalUrl?.includes("/webhook")) {
    return next();
  }

  const rawKey = req.headers["idempotency-key"];
  const idempotencyKey = Array.isArray(rawKey) ? rawKey[0] : rawKey;

  if (!idempotencyKey || typeof idempotencyKey !== "string" || !idempotencyKey.trim()) {
    return next();
  }

  // Scope idempotency key by method, path, and key string
  const key = `${method}:${req.baseUrl || ""}${req.path}:${idempotencyKey.trim()}`;
  const existing = idempotencyCache.get(key);

  if (existing) {
    if (existing.inFlight) {
      return res.status(409).json({
        success: false,
        error: "A request with this Idempotency-Key is currently being processed. Please retry in a few seconds.",
      });
    }

    res.setHeader("X-Idempotent-Replay", "true");
    return res.status(existing.status).json(existing.body);
  }

  // Mark as currently in-flight
  idempotencyCache.set(key, {
    status: 0,
    body: null,
    timestamp: Date.now(),
    inFlight: true,
  });

  // Intercept response
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    // Only cache successful or intentional client/server responses (not transient 500s that client might legitimately retry)
    if (res.statusCode < 500) {
      idempotencyCache.set(key, {
        status: res.statusCode,
        body,
        timestamp: Date.now(),
        inFlight: false,
      });
    } else {
      idempotencyCache.delete(key);
    }
    return originalJson(body);
  };

  next();
}
