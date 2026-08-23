import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { prisma } from "@devflow/database";
import { config } from "../../config/index.js";
import { createError } from "../../middleware/errorHandler.js";

export class AuthService {
  /**
   * Register a new user and issue token pair
   */
  static async register(data: { email: string; password: string; name: string }) {
    const { email, password, name } = data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw createError("Email already registered", 409);
    }

    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
      select: { id: true, email: true, name: true, avatar: true },
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

    return { user, tokens };
  }

  /**
   * Authenticate credentials and issue token pair
   */
  static async login(data: { email: string; password: string }) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw createError("Invalid email or password", 401);
    }

    const validPassword = await argon2.verify(user.password, password);
    if (!validPassword) {
      throw createError("Invalid email or password", 401);
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

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
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
   * Logout user by invalidating the refresh token family
   */
  static async logout(refreshToken?: string) {
    if (refreshToken) {
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (storedToken) {
        await prisma.refreshToken.deleteMany({
          where: { family: storedToken.family },
        });
      }
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
        createdAt: true,
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
    const accessToken = jwt.sign({ userId, email }, config.jwtSecret, {
      expiresIn: config.jwtAccessExpiry as any,
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    });

    const refreshToken = jwt.sign(
      { userId, tokenType: "refresh" },
      config.jwtSecret,
      {
        expiresIn: config.jwtRefreshExpiry as any,
        issuer: config.jwtIssuer,
        audience: config.jwtAudience,
      }
    );

    return { accessToken, refreshToken };
  }
}
