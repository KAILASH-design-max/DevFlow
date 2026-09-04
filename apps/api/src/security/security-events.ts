import { prisma } from "@devflow/database";

export type SecurityEventType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "OTP_REQUEST"
  | "OTP_FAILURE"
  | "OTP_EXPIRED"
  | "OTP_LOCKED"
  | "PASSWORDLESS_LOGIN"
  | "SESSION_CREATED"
  | "SESSION_REVOKED"
  | "ROLE_CHANGED"
  | "MEMBER_INVITED"
  | "WEBHOOK_REJECTED"
  | "WEBHOOK_PROCESSED"
  | "IDOR_ATTEMPT"
  | "RATE_LIMIT_EXCEEDED"
  | "LOGOUT";

export interface LogSecurityEventParams {
  userId?: string | null;
  workspaceId?: string | null;
  eventType: SecurityEventType;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any> | null;
}

export class SecurityEventLogger {
  static async log(params: LogSecurityEventParams): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          userId: params.userId || null,
          workspaceId: params.workspaceId || null,
          eventType: params.eventType,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        },
      });
    } catch (err: any) {
      // Non-blocking security audit logger: never crash user request if audit insert fails
      console.warn("[SecurityEventLogger] Failed to record event:", err?.message);
    }
  }
}
