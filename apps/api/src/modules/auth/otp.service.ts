import crypto from "crypto";
import argon2 from "argon2";
import { prisma } from "@devflow/database";
import { config } from "../../config/index.js";
import { createError } from "../../middleware/errorHandler.js";
import { AuthService } from "./auth.service.js";
import { EmailService } from "../../services/email.service.js";
import { SecurityAuditService } from "./audit.service.js";
import { adminAuth, isFirebaseConfigured } from "../../config/firebaseAdmin.js";

// Purpose Enum matching Prisma Schema
export type OtpPurpose = "SIGNUP" | "LOGIN" | "PASSWORD_RESET" | "EMAIL_CHANGE";

export class OtpService {
  /**
   * Generates a cryptographically secure 6-digit numeric OTP code
   */
  private static generate6DigitOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Securely hashes an OTP with server pepper and unique record salt.
   * Format: `${salt}:${hmac}`
   */
  private static hashOtp(otp: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const hmac = crypto
      .createHmac("sha256", config.otpHashSecret)
      .update(`${otp}:${salt}`)
      .digest("hex");
    return `${salt}:${hmac}`;
  }

  /**
   * Timing-safe verification of an OTP against its stored hash
   */
  private static verifyOtpHash(submittedOtp: string, storedRecord: string): boolean {
    const [salt, originalHmac] = storedRecord.split(":");
    if (!salt || !originalHmac) return false;

    const computedHmac = crypto
      .createHmac("sha256", config.otpHashSecret)
      .update(`${submittedOtp.trim()}:${salt}`)
      .digest("hex");

    const computedBuf = Buffer.from(computedHmac, "hex");
    const originalBuf = Buffer.from(originalHmac, "hex");

    if (computedBuf.length !== originalBuf.length) return false;
    return crypto.timingSafeEqual(computedBuf, originalBuf);
  }

  /**
   * Helper to ensure a Firebase user exists and mint a Firebase Custom Token
   */
  static async getOrCreateFirebaseCustomToken(user: {
    id: string;
    email: string;
    name?: string | null;
  }): Promise<string | null> {
    if (!isFirebaseConfigured) {
      return null;
    }
    try {
      let fbUser;
      try {
        fbUser = await adminAuth.getUserByEmail(user.email);
      } catch (e: any) {
        if (e.code === "auth/user-not-found") {
          fbUser = await adminAuth.createUser({
            uid: user.id,
            email: user.email,
            displayName: user.name || user.email.split("@")[0],
            emailVerified: true,
          });
        }
      }
      const fbUid = fbUser?.uid || user.id;
      return await adminAuth.createCustomToken(fbUid, {
        userId: user.id,
        email: user.email,
      });
    } catch (fbErr: any) {
      console.warn("[OtpService] Firebase Custom Token notice:", fbErr?.message || fbErr);
      return null;
    }
  }

  /**
   * 1. Send Sign Up OTP
   */
  static async sendSignupOtp(data: {
    email: string;
    name?: string;
    password?: string;
    role?: string;
    workspaceUrl?: string;
    ip?: string;
    userAgent?: string;
  }) {
    const { email, name, password, role, workspaceUrl, ip, userAgent } = data;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // Generic error preventing account enumeration
      throw createError("This email address is not available for new registration. Please sign in.", 409);
    }

    if (password && password.length < 8) {
      throw createError("Password must be at least 8 characters long", 400);
    }

    // Rate Limiting: 60-second cooldown
    const recentOtp = await prisma.emailVerification.findFirst({
      where: {
        email: normalizedEmail,
        purpose: "SIGNUP",
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (recentOtp) {
      const remainingSec = Math.ceil((recentOtp.createdAt.getTime() + 60000 - Date.now()) / 1000);
      throw createError(`Please wait ${remainingSec > 0 ? remainingSec : 60} seconds before requesting another code.`, 429);
    }

    // Rate Limiting: Maximum 3 resend requests per 15 minutes
    const fifteenMinCount = await prisma.emailVerification.count({
      where: {
        email: normalizedEmail,
        purpose: "SIGNUP",
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
      },
    });

    if (fifteenMinCount >= 3) {
      throw createError("Too many verification requests. Please wait 15 minutes before requesting a new code.", 429);
    }

    // Invalidate prior unused signup codes for this email
    await prisma.emailVerification.deleteMany({
      where: { email: normalizedEmail, purpose: "SIGNUP", verifiedAt: null },
    });

    let passwordHash = "";
    if (password) {
      passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    }

    const challengeId = crypto.randomUUID();
    const otp = this.generate6DigitOtp();
    const otpHash = this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Strict 5-minute lifetime

    const payload = JSON.stringify({
      name: name || normalizedEmail.split("@")[0],
      passwordHash,
      role: role || "DEVELOPER",
      workspaceUrl: workspaceUrl || null,
    });

    await prisma.emailVerification.create({
      data: {
        challengeId,
        email: normalizedEmail,
        otpHash,
        purpose: "SIGNUP",
        payload,
        expiresAt,
      },
    });

    // Send email via EmailService
    const emailSent = await EmailService.sendSignupOTP(normalizedEmail, otp);
    if (!emailSent) {
      throw createError("Failed to deliver verification email. Please try again.", 500);
    }

    // Audit Logging
    await SecurityAuditService.logEvent({
      action: "SIGNUP_STARTED",
      email: normalizedEmail,
      ip,
      userAgent,
      metadata: { purpose: "SIGNUP", challengeId },
    });

    return {
      success: true,
      challengeId,
      message: "Verification code sent to your email address.",
      email: normalizedEmail,
      expiresInSec: 300,
    };
  }

  /**
   * 2. Verify Sign Up OTP & Complete Account Activation
   */
  static async verifySignupOtp(data: {
    email: string;
    code: string;
    challengeId?: string;
    ip?: string;
    userAgent?: string;
  }) {
    const { email, code, challengeId, ip, userAgent } = data;
    const normalizedEmail = email.trim().toLowerCase();

    if (!code || code.trim().length !== 6 || !/^\d{6}$/.test(code.trim())) {
      throw createError("Verification code must be exactly 6 numeric digits", 400);
    }

    const record = await prisma.emailVerification.findFirst({
      where: {
        email: normalizedEmail,
        purpose: "SIGNUP",
        verifiedAt: null,
        ...(challengeId ? { challengeId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      throw createError("No pending verification found. Please request a new code.", 400);
    }

    // Check expiration (5 minutes)
    if (record.expiresAt < new Date()) {
      await SecurityAuditService.logEvent({
        action: "OTP_EXPIRED",
        email: normalizedEmail,
        ip,
        userAgent,
        metadata: { purpose: "SIGNUP" },
      });
      throw createError("Verification code has expired. Please request a new one.", 400);
    }

    // Check attempt limits (max 5 attempts)
    if (record.attempts >= 5) {
      await SecurityAuditService.logEvent({
        action: "OTP_LOCKED",
        email: normalizedEmail,
        ip,
        userAgent,
        metadata: { purpose: "SIGNUP", reason: "MAX_ATTEMPTS_EXCEEDED" },
      });
      throw createError("Maximum verification attempts exceeded. Please request a new code.", 429);
    }

    // Secure timing-safe hash comparison
    const isMatch = this.verifyOtpHash(code, record.otpHash);
    if (!isMatch) {
      await prisma.emailVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw createError("Invalid verification code. Please check and try again.", 400);
    }

    // Mark as verified/consumed (Replay protection)
    await prisma.emailVerification.update({
      where: { id: record.id },
      data: { verifiedAt: new Date() },
    });

    // Parse stored payload
    const payload = record.payload ? JSON.parse(record.payload) : {};
    const name = payload.name || normalizedEmail.split("@")[0];
    const password = payload.passwordHash || (await argon2.hash(crypto.randomBytes(16).toString("hex"), { type: argon2.argon2id }));

    // Create User with emailVerified = true and emailVerifiedAt = now()
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name,
        password,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Link EmailVerification record to created user
    await prisma.emailVerification.update({
      where: { id: record.id },
      data: { userId: user.id },
    }).catch(() => {});

    // Create Workspace & Workspace Member
    try {
      const slug = (payload.workspaceUrl || name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") + "-workspace";

      const workspace = await prisma.workspace.create({
        data: {
          name: `${name}'s Workspace`,
          slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
          ownerId: user.id,
        },
      });

      await prisma.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: payload.role === "ADMIN" ? "ADMIN" : "DEVELOPER",
        },
      });
    } catch {
      // Non-blocking workspace initialization fallback
    }

    const tokens = AuthService.generateTokens(user.id, user.email);

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        family: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.session.create({
      data: {
        userId: user.id,
        device: "Web Browser",
        browser: "Chrome",
        os: "Desktop",
        ip: ip || "127.0.0.1",
        location: "Unknown",
        isCurrent: true,
      },
    }).catch(() => {});

    // Audit Logging
    await SecurityAuditService.logEvent({
      action: "SIGNUP_VERIFIED",
      email: normalizedEmail,
      userId: user.id,
      ip,
      userAgent,
    });

    // Mint Firebase Custom Token for unified identity
    const customToken = await this.getOrCreateFirebaseCustomToken(user);

    return { user, tokens, customToken };
  }

  /**
   * 3. Send Login OTP (Passwordless with PostgreSQL Validation)
   */
  static async sendLoginOtp(data: {
    email: string;
    ip?: string;
    userAgent?: string;
  }) {
    const { email, ip, userAgent } = data;

    // 1. Validate email syntax
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      throw createError("Please enter a valid email address.", 400);
    }

    // 2. Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // 3. Rate Limiting: 60-second cooldown
    const recentOtp = await prisma.emailVerification.findFirst({
      where: {
        email: normalizedEmail,
        purpose: "LOGIN",
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (recentOtp) {
      const remainingSec = Math.ceil((recentOtp.createdAt.getTime() + 60000 - Date.now()) / 1000);
      throw createError(`Please wait ${remainingSec > 0 ? remainingSec : 60} seconds before requesting another code.`, 429);
    }

    // Rate Limiting: Max 3 requests per 15 minutes
    const fifteenMinCount = await prisma.emailVerification.count({
      where: {
        email: normalizedEmail,
        purpose: "LOGIN",
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
      },
    });

    if (fifteenMinCount >= 3) {
      throw createError("Too many verification requests. Please wait 15 minutes before requesting a new code.", 429);
    }

    // 4. Query PostgreSQL using Prisma User model
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // 5. If user does NOT exist in PostgreSQL → STOP immediately with 404
    if (!user) {
      throw createError("This email ID is invalid.", 404);
    }

    // 6. User exists → Retrieve canonical email from PostgreSQL
    const registeredEmail = user.email;

    // 7. Invalidate prior unused login codes
    await prisma.emailVerification.deleteMany({
      where: { email: normalizedEmail, purpose: "LOGIN", verifiedAt: null },
    });

    // 8. Generate secure 6-digit OTP
    // 8. Generate secure 6-digit OTP and challenge ID
    const challengeId = crypto.randomUUID();
    const otp = this.generate6DigitOtp();
    const otpHash = this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Strict 5-minute lifetime

    // 9. Store hashed OTP
    await prisma.emailVerification.create({
      data: {
        challengeId,
        userId: user.id,
        email: normalizedEmail,
        otpHash,
        purpose: "LOGIN",
        expiresAt,
      },
    });

    // 10. Send OTP to registeredEmail
    const emailSent = await EmailService.sendLoginOTP(registeredEmail, otp);
    if (!emailSent) {
      throw createError("Failed to deliver sign-in verification code. Please try again.", 500);
    }

    await SecurityAuditService.logEvent({
      action: "LOGIN_OTP_SENT",
      email: normalizedEmail,
      userId: user.id,
      ip,
      userAgent,
      metadata: { challengeId },
    });

    return {
      success: true,
      challengeId,
      message: "Verification code sent to your registered email.",
      nextStep: "VERIFY_OTP",
      email: registeredEmail,
      expiresInSec: 300,
    };
  }

  /**
   * 4. Verify Login OTP & Issue Authenticated Session
   */
  static async verifyLoginOtp(data: {
    email: string;
    code: string;
    challengeId?: string;
    ip?: string;
    userAgent?: string;
  }) {
    const { email, code, challengeId, ip, userAgent } = data;
    const normalizedEmail = email.trim().toLowerCase();

    if (!code || code.trim().length !== 6 || !/^\d{6}$/.test(code.trim())) {
      throw createError("Verification code must be exactly 6 numeric digits", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        emailVerified: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw createError("Invalid verification code or session expired.", 400);
    }

    const record = await prisma.emailVerification.findFirst({
      where: {
        email: normalizedEmail,
        purpose: "LOGIN",
        verifiedAt: null,
        ...(challengeId ? { challengeId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      throw createError("No active sign-in code found. Please request a new code.", 400);
    }

    // Check expiration (5 minutes)
    if (record.expiresAt < new Date()) {
      await SecurityAuditService.logEvent({
        action: "OTP_EXPIRED",
        email: normalizedEmail,
        userId: user.id,
        ip,
        userAgent,
        metadata: { purpose: "LOGIN" },
      });
      throw createError("Verification code has expired. Please request a new one.", 400);
    }

    // Check attempt limits (max 5 attempts)
    if (record.attempts >= 5) {
      await SecurityAuditService.logEvent({
        action: "OTP_LOCKED",
        email: normalizedEmail,
        userId: user.id,
        ip,
        userAgent,
        metadata: { purpose: "LOGIN", reason: "MAX_ATTEMPTS_EXCEEDED" },
      });
      throw createError("Maximum verification attempts exceeded. Please request a new code.", 429);
    }

    // Timing-safe comparison
    const isMatch = this.verifyOtpHash(code, record.otpHash);
    if (!isMatch) {
      await prisma.emailVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      await SecurityAuditService.logEvent({
        action: "LOGIN_OTP_FAILED",
        email: normalizedEmail,
        userId: user.id,
        ip,
        userAgent,
      });
      throw createError("Invalid verification code. Please check and try again.", 400);
    }

    // Mark as consumed (Replay protection)
    await prisma.emailVerification.update({
      where: { id: record.id },
      data: { verifiedAt: new Date() },
    });

    // Ensure emailVerified is marked true
    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      });
      user.emailVerified = true;
    }

    const tokens = AuthService.generateTokens(user.id, user.email);

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        family: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.session.create({
      data: {
        userId: user.id,
        device: "Web Browser",
        browser: "Chrome",
        os: "Desktop",
        ip: ip || "127.0.0.1",
        location: "Unknown",
        isCurrent: true,
      },
    }).catch(() => {});

    await SecurityAuditService.logEvent({
      action: "LOGIN_SUCCESS",
      email: normalizedEmail,
      userId: user.id,
      ip,
      userAgent,
      metadata: { method: "EMAIL_OTP" },
    });

    // Mint Firebase Custom Token for unified identity
    const customToken = await this.getOrCreateFirebaseCustomToken(user);

    return { user, tokens, customToken };
  }

  /**
   * 5. Password Reset: Request OTP
   */
  static async sendPasswordResetOtp(data: {
    email: string;
    ip?: string;
    userAgent?: string;
  }) {
    const { email, ip, userAgent } = data;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Safe generic response to prevent account enumeration
    const genericSuccess = {
      message: "If an account exists with this email, a password reset code has been sent.",
      email: normalizedEmail,
      expiresInSec: 300,
    };

    if (!user) {
      return genericSuccess;
    }

    // 60-second cooldown
    const recentOtp = await prisma.emailVerification.findFirst({
      where: {
        email: normalizedEmail,
        purpose: "PASSWORD_RESET",
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (recentOtp) {
      const remainingSec = Math.ceil((recentOtp.createdAt.getTime() + 60000 - Date.now()) / 1000);
      throw createError(`Please wait ${remainingSec > 0 ? remainingSec : 60} seconds before requesting another code.`, 429);
    }

    // Invalidate previous reset OTPs
    await prisma.emailVerification.deleteMany({
      where: { email: normalizedEmail, purpose: "PASSWORD_RESET", verifiedAt: null },
    });

    const otp = this.generate6DigitOtp();
    const otpHash = this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        email: normalizedEmail,
        otpHash,
        purpose: "PASSWORD_RESET",
        expiresAt,
      },
    });

    await EmailService.sendPasswordResetOTP(normalizedEmail, otp);

    await SecurityAuditService.logEvent({
      action: "PASSWORD_RESET_STARTED",
      email: normalizedEmail,
      userId: user.id,
      ip,
      userAgent,
    });

    return genericSuccess;
  }

  /**
   * 6. Password Reset: Verify OTP & Update Password
   */
  static async resetPasswordWithOtp(data: {
    email: string;
    code: string;
    newPassword: string;
    ip?: string;
    userAgent?: string;
  }) {
    const { email, code, newPassword, ip, userAgent } = data;
    const normalizedEmail = email.trim().toLowerCase();

    if (!newPassword || newPassword.length < 8) {
      throw createError("New password must be at least 8 characters long", 400);
    }

    if (!code || code.trim().length !== 6 || !/^\d{6}$/.test(code.trim())) {
      throw createError("Verification code must be exactly 6 numeric digits", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw createError("Invalid verification code or request expired.", 400);
    }

    const record = await prisma.emailVerification.findFirst({
      where: {
        email: normalizedEmail,
        purpose: "PASSWORD_RESET",
        verifiedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      throw createError("No pending password reset request found. Please request a new code.", 400);
    }

    // Check expiration (5 minutes)
    if (record.expiresAt < new Date()) {
      await SecurityAuditService.logEvent({
        action: "OTP_EXPIRED",
        email: normalizedEmail,
        userId: user.id,
        ip,
        userAgent,
        metadata: { purpose: "PASSWORD_RESET" },
      });
      throw createError("Password reset code has expired. Please request a new one.", 400);
    }

    // Check attempt limits
    if (record.attempts >= 5) {
      await SecurityAuditService.logEvent({
        action: "OTP_LOCKED",
        email: normalizedEmail,
        userId: user.id,
        ip,
        userAgent,
        metadata: { purpose: "PASSWORD_RESET", reason: "MAX_ATTEMPTS_EXCEEDED" },
      });
      throw createError("Maximum verification attempts exceeded. Please request a new code.", 429);
    }

    // Timing-safe comparison
    const isMatch = this.verifyOtpHash(code, record.otpHash);
    if (!isMatch) {
      await prisma.emailVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw createError("Invalid verification code. Please check and try again.", 400);
    }

    // Mark as consumed (Replay protection)
    await prisma.emailVerification.update({
      where: { id: record.id },
      data: { verifiedAt: new Date() },
    });

    // Hash new password and update user
    const hashedPassword = await argon2.hash(newPassword, { type: argon2.argon2id });
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        emailVerified: true,
        emailVerifiedAt: user.emailVerifiedAt || new Date(),
      },
    });

    // Revoke all existing sessions and refresh tokens for security
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    await SecurityAuditService.logEvent({
      action: "PASSWORD_RESET_COMPLETED",
      email: normalizedEmail,
      userId: user.id,
      ip,
      userAgent,
    });

    return {
      message: "Your password has been successfully reset. Please log in with your new credentials.",
    };
  }

  /**
   * 7. Resend OTP with cooldown and rate-limiting
   */
  static async resendOtp(data: {
    email: string;
    purpose: OtpPurpose;
    password?: string;
    name?: string;
    role?: string;
    workspaceUrl?: string;
    ip?: string;
    userAgent?: string;
  }) {
    const { email, purpose, password, name, role, workspaceUrl, ip, userAgent } = data;

    // Log resend attempt
    await SecurityAuditService.logEvent({
      action: "OTP_RESEND",
      email: email.trim().toLowerCase(),
      ip,
      userAgent,
      metadata: { purpose },
    });

    if (purpose === "LOGIN") {
      return this.sendLoginOtp({ email, ip, userAgent });
    } else if (purpose === "PASSWORD_RESET") {
      return this.sendPasswordResetOtp({ email, ip, userAgent });
    } else {
      return this.sendSignupOtp({ email, name, password, role, workspaceUrl, ip, userAgent });
    }
  }
}
