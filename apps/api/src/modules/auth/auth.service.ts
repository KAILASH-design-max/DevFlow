import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import crypto from "crypto";
import UAParser from "ua-parser-js";
import { prisma } from "@devflow/database";
import { config } from "../../config/index.js";
import { createError } from "../../middleware/errorHandler.js";
import { generateBase32Secret, verifyTotpCode } from "../../utils/totp.js";
import { LocalQrCode } from "../../utils/qr.js";

/**
 * Parse User-Agent string into session metadata
 */
function parseSessionMetadata(ip?: string, userAgent?: string) {
  const parsed = (UAParser as any)(userAgent || "");
  const browser = parsed.browser || {};
  const os = parsed.os || {};
  const device = parsed.device || {};

  return {
    device: device.model || device.vendor || (device.type === "mobile" ? "Mobile" : "Desktop"),
    browser: browser.name ? `${browser.name} ${browser.major || ""}`.trim() : "Unknown",
    os: os.name ? `${os.name} ${os.version || ""}`.trim() : "Unknown",
    ip: ip || "unknown",
    location: "Unknown",
  };
}

export class AuthService {
  /**
   * Register a new user and issue token pair
   */
  static async register(data: { email: string; password: string; name: string; ip?: string; userAgent?: string }) {
    const { email, password, name, ip, userAgent } = data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw createError("Email already registered", 409);
    }

    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, emailVerified: true, emailVerifiedAt: new Date() },
      select: { id: true, email: true, name: true, avatar: true, emailVerified: true },
    });

    const tokens = this.generateTokens(user.id, user.email);
    const family = uuid();

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        family,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const session = parseSessionMetadata(ip, userAgent);
    await prisma.session.create({
      data: {
        userId: user.id,
        device: session.device,
        browser: session.browser,
        os: session.os,
        ip: session.ip,
        location: session.location,
        isCurrent: true,
      },
    });

    return { user, tokens };
  }

  /**
   * Authenticate credentials and issue token pair
   */
  static async login(data: { email: string; password: string; code?: string; ip?: string; userAgent?: string }) {
    const { email, password, code, ip, userAgent } = data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw createError("Invalid email or password", 401);
    }

    const validPassword = await argon2.verify(user.password, password);
    if (!validPassword) {
      throw createError("Invalid email or password", 401);
    }

    // Auto-verify legacy accounts created before email verification upon successful login
    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      });
      user.emailVerified = true;
    }

    // Enforce 2FA if enabled on user account
    if (user.twoFactorEnabled) {
      if (!code) {
        throw createError("Two-Factor Authentication code required", 401);
      }

      let is2FaValid = false;
      if (user.twoFactorSecret) {
        is2FaValid = verifyTotpCode(user.twoFactorSecret, code);
      }

      // Check backup recovery codes if TOTP fails
      if (!is2FaValid && user.twoFactorRecoveryCodes) {
        try {
          const recoveryCodes: string[] = JSON.parse(user.twoFactorRecoveryCodes);
          const normalizedCode = code.trim().toLowerCase();
          const matchIndex = recoveryCodes.findIndex(
            (rc) => rc.toLowerCase() === normalizedCode || rc.replace("-", "").toLowerCase() === normalizedCode.replace("-", "")
          );

          if (matchIndex !== -1) {
            is2FaValid = true;
            // Invalidate the used recovery code
            recoveryCodes.splice(matchIndex, 1);
            await prisma.user.update({
              where: { id: user.id },
              data: { twoFactorRecoveryCodes: JSON.stringify(recoveryCodes) },
            });
          }
        } catch {
          // Ignore parse errors
        }
      }

      if (!is2FaValid) {
        throw createError("Invalid Two-Factor Authentication code", 401);
      }
    }

    const tokens = this.generateTokens(user.id, user.email);
    const family = uuid();

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        family,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const session = parseSessionMetadata(ip, userAgent);
    await prisma.session.create({
      data: {
        userId: user.id,
        device: session.device,
        browser: session.browser,
        os: session.os,
        ip: session.ip,
        location: session.location,
        isCurrent: true,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      },
      tokens,
    };
  }

  /**
   * Refresh access token with family-based reuse detection
   */
  static async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw createError("Refresh token required", 401);
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw createError("Invalid refresh token", 401);
    }

    // Token reuse detection (compromise safeguard)
    if (storedToken.used) {
      await prisma.refreshToken.deleteMany({
        where: { family: storedToken.family },
      });
      throw createError("Token reuse detected. Please sign in again.", 401);
    }

    if (storedToken.expiresAt < new Date()) {
      throw createError("Refresh token expired. Please sign in again.", 401);
    }

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { used: true },
    });

    const tokens = this.generateTokens(storedToken.user.id, storedToken.user.email);

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: storedToken.user.id,
        family: storedToken.family,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return tokens;
  }

  /**
   * Logout user by invalidating the refresh token family and deactivating sessions
   */
  static async logout(refreshToken?: string, userId?: string) {
    if (refreshToken) {
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (storedToken) {
        await prisma.refreshToken.deleteMany({
          where: { family: storedToken.family },
        });
        if (!userId) userId = storedToken.userId;
      }
    }

    if (userId) {
      await prisma.session.updateMany({
        where: { userId, isCurrent: true },
        data: { isCurrent: false },
      }).catch(() => {});
    }
  }

  /**
   * Cleanup expired refresh tokens from the database (prevents unbounded DB growth - M4 fix)
   */
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      return result.count;
    } catch (err) {
      console.warn("Expired token cleanup error:", err);
      return 0;
    }
  }

  /**
   * Get user profile details
   */
  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        emailVerified: true,
        emailVerifiedAt: true,
        createdAt: true,
        bio: true,
        title: true,
        timezone: true,
        githubUsername: true,
        themePreference: true,
        twoFactorEnabled: true,
        workspaceMembers: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user) {
      throw createError("User not found", 404);
    }

    return user;
  }

  /**
   * Internal helper: Generate JWT tokens with claims
   */
  static generateTokens(userId: string, email: string) {
    const accessToken = jwt.sign({ userId, email, jti: uuid() }, config.jwtSecret, {
      expiresIn: config.jwtAccessExpiry as any,
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    });

    const refreshToken = jwt.sign(
      { userId, tokenType: "refresh", jti: uuid() },
      config.jwtSecret,
      {
        expiresIn: config.jwtRefreshExpiry as any,
        issuer: config.jwtIssuer,
        audience: config.jwtAudience,
      }
    );

    return { accessToken, refreshToken };
  }

  // ─────────────────────────────────────────────
  // Firebase User Sync
  // ─────────────────────────────────────────────

  /**
   * Upsert a Prisma user from Firebase credentials.
   * Uses Firebase UID as the Prisma user ID so they stay linked.
   */
  static async firebaseSync(
    firebaseUid: string,
    email: string,
    data?: { name?: string; avatar?: string; role?: string }
  ) {
    const existing = await prisma.user.findUnique({ where: { id: firebaseUid } });

    if (existing) {
      // Update name/avatar if provided and changed
      const updates: any = {};
      if (data?.name && data.name !== existing.name) updates.name = data.name;
      if (data?.avatar && data.avatar !== existing.avatar) updates.avatar = data.avatar;

      if (Object.keys(updates).length > 0) {
        const updated = await prisma.user.update({
          where: { id: firebaseUid },
          data: updates,
          select: { id: true, email: true, name: true, avatar: true },
        });
        return updated;
      }

      return { id: existing.id, email: existing.email, name: existing.name, avatar: existing.avatar };
    }

    // Create new user with Firebase UID as the primary key
    // Check if email already exists (from a legacy non-Firebase registration)
    const emailUser = await prisma.user.findUnique({ where: { email } });
    if (emailUser) {
      // Link existing email user — return it as-is
      return { id: emailUser.id, email: emailUser.email, name: emailUser.name, avatar: emailUser.avatar };
    }

    const derivedName = data?.name || email.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ");
    const user = await prisma.user.create({
      data: {
        id: firebaseUid,
        email,
        password: "firebase-auth-managed", // Placeholder — password managed by Firebase
        name: derivedName,
        avatar: data?.avatar || null,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
      select: { id: true, email: true, name: true, avatar: true, emailVerified: true },
    });

    // Auto-create a default workspace for new users
    try {
      const slug = derivedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-workspace";
      const workspace = await prisma.workspace.create({
        data: {
          name: `${derivedName}'s Workspace`,
          slug,
          ownerId: user.id,
        },
      });
      await prisma.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: "ADMIN",
        },
      });
    } catch {
      // Workspace creation is best-effort
    }

    return user;
  }

  // ─────────────────────────────────────────────
  // User Profile, Security & 2FA (Phases 22–24)
  // ─────────────────────────────────────────────

  /**
   * Update User Profile
   */
  static async updateProfile(
    userId: string,
    data: {
      name?: string;
      avatar?: string;
      bio?: string;
      title?: string;
      timezone?: string;
      githubUsername?: string;
      themePreference?: string;
    }
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw createError("User not found", 404);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name ?? user.name,
        avatar: data.avatar ?? user.avatar,
        bio: data.bio ?? user.bio,
        title: data.title ?? user.title,
        timezone: data.timezone ?? user.timezone,
        githubUsername: data.githubUsername ?? user.githubUsername,
        themePreference: data.themePreference ?? user.themePreference,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        title: true,
        timezone: true,
        githubUsername: true,
        themePreference: true,
        twoFactorEnabled: true,
      },
    });

    return {
      ...updatedUser,
      isTwoFactorEnabled: updatedUser.twoFactorEnabled,
    };
  }

  /**
   * Get Full User Profile with extended metadata
   */
  static async getFullProfile(userId: string) {
    const user = await this.getCurrentUser(userId);

    return {
      ...user,
      isTwoFactorEnabled: user.twoFactorEnabled || false,
    };
  }

  /**
   * Change Password with Argon2 verification
   */
  static async changePassword(
    userId: string,
    data: { currentPassword: string; newPassword: string }
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw createError("User not found", 404);

    const validPassword = await argon2.verify(user.password, data.currentPassword);
    if (!validPassword) {
      throw createError("Incorrect current password", 400);
    }

    if (data.newPassword.length < 8) {
      throw createError("New password must be at least 8 characters long", 400);
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.newPassword)) {
      throw createError("Password must contain at least one uppercase letter, one lowercase letter, and one number", 400);
    }

    const hashedPassword = await argon2.hash(data.newPassword, {
      type: argon2.argon2id,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: "Password updated successfully" };
  }

  /**
   * Start 2FA Setup
   */
  static async generate2FaSecret(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw createError("User not found", 404);

    // Standard RFC 6238 Base32 Secret
    const secret = generateBase32Secret(32);
    const otpauthUrl = `otpauth://totp/DevFlow:${encodeURIComponent(user.email)}?secret=${secret}&issuer=DevFlow`;
    const qrCodeUrl = LocalQrCode.toDataUrl(otpauthUrl, 200);

    const recoveryCodes = Array.from({ length: 8 }, () => {
      const bytes = crypto.randomBytes(4).toString("hex").toUpperCase();
      return `${bytes.slice(0, 4)}-${bytes.slice(4, 8)}`;
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorRecoveryCodes: JSON.stringify(recoveryCodes),
      },
    });

    return {
      secret,
      otpauthUrl,
      qrCodeUrl,
      recoveryCodes,
    };
  }

  /**
   * Verify and enable 2FA
   */
  static async verifyAndEnable2Fa(userId: string, code: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw createError("2FA setup not initiated. Please start setup first.", 400);
    }

    // Accept valid 6-digit format
    if (!/^\d{6}$/.test(code.trim())) {
      throw createError("Verification code must be 6 digits", 400);
    }

    // Authentic RFC 6238 TOTP verification with ±30s drift window
    const isValid = verifyTotpCode(user.twoFactorSecret, code.trim());
    if (!isValid) {
      throw createError("Invalid verification code", 400);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return {
      message: "Two-Factor Authentication successfully enabled",
      recoveryCodes: user.twoFactorRecoveryCodes ? JSON.parse(user.twoFactorRecoveryCodes) : [],
    };
  }

  /**
   * Disable 2FA
   */
  static async disable2Fa(userId: string, password: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw createError("User not found", 404);

    const validPassword = await argon2.verify(user.password, password);
    if (!validPassword) {
      throw createError("Invalid password. Required to disable 2FA.", 400);
    }
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorRecoveryCodes: null,
      },
    });

    return { message: "Two-Factor Authentication disabled" };
  }

  /**
   * List active login sessions
   */
  static async listSessions(userId: string) {
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { lastActive: "desc" },
    });
    return sessions;
  }

  /**
   * Revoke active login session
   */
  static async revokeSession(userId: string, sessionId: string) {
    await prisma.session.deleteMany({
      where: {
        id: sessionId,
        userId,
      },
    });
    return { success: true, message: "Session revoked successfully" };
  }
}

