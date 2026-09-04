import { prisma } from "@devflow/database";

export type SecurityAuditEvent =
  | "SIGNUP_STARTED"
  | "SIGNUP_VERIFIED"
  | "LOGIN_STARTED"
  | "LOGIN_OTP_SENT"
  | "LOGIN_OTP_FAILED"
  | "LOGIN_SUCCESS"
  | "OTP_RESEND"
  | "OTP_EXPIRED"
  | "OTP_LOCKED"
  | "PASSWORD_RESET_STARTED"
  | "PASSWORD_RESET_COMPLETED"
  | "LOGOUT";

export class SecurityAuditService {
  /**
   * Log an authentication or OTP security event.
   * Strips all passwords, OTP codes, and authentication tokens before persisting.
   */
  static async logEvent(params: {
    action: SecurityAuditEvent;
    email: string;
    userId?: string | null;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const { action, email, userId, ip, userAgent, metadata = {} } = params;

    // Sanitize metadata to guarantee zero secret leakage
    const sanitizedMetadata: Record<string, any> = {
      ip: ip || "unknown",
      userAgent: userAgent ? userAgent.substring(0, 100) : "unknown",
      timestamp: new Date().toISOString(),
    };

    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes("otp") ||
        lowerKey.includes("code") ||
        lowerKey.includes("password") ||
        lowerKey.includes("token") ||
        lowerKey.includes("secret") ||
        lowerKey.includes("hash")
      ) {
        // Redact any potentially sensitive parameters
        sanitizedMetadata[key] = "[REDACTED]";
      } else {
        sanitizedMetadata[key] = value;
      }
    }

    try {
      await prisma.auditLog.create({
        data: {
          action,
          entityType: "AUTH",
          entityId: email.trim().toLowerCase(),
          userId: userId || null,
          metadata: JSON.stringify(sanitizedMetadata),
        },
      });
    } catch (err) {
      // Best-effort non-blocking security audit logging
      console.warn(`[SecurityAuditService] Failed to record audit log for ${action}:`, (err as any)?.message);
    }
  }
}
