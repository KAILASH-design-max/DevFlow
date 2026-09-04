import { Router, Request, Response, NextFunction } from "express";
import { config } from "../../config/index.js";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/auth.js";
import {
  authLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  passwordResetLimiter,
} from "../../middleware/rateLimiter.js";
import { registerSchema, loginSchema } from "@devflow/shared";
import { AuthService } from "./auth.service.js";
import { OtpService } from "./otp.service.js";
import { SecurityAuditService } from "./audit.service.js";
import { EmailService } from "../../services/email.service.js";

export const authRouter = Router();

// ─── OTP: Send Sign Up Verification Code ────────
authRouter.post(
  "/otp/send-signup",
  otpSendLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, password, role, workspaceUrl } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: "Email is required" });
      }
      const result = await OtpService.sendSignupOtp({
        email,
        name,
        password,
        role,
        workspaceUrl,
        ip: req.ip,
        userAgent: req.headers["user-agent"] as string,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// ─── OTP: Verify Sign Up & Create Account ───────
authRouter.post(
  "/otp/verify-signup",
  otpVerifyLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, code, challengeId } = req.body;
      if (!email || !code) {
        return res.status(400).json({ success: false, error: "Email and 6-digit code are required" });
      }
      const { user, tokens, customToken } = await OtpService.verifySignupOtp({
        email,
        code,
        challengeId,
        ip: req.ip,
        userAgent: req.headers["user-agent"] as string,
      });

      res.cookie("accessToken", tokens.accessToken, {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        authenticated: true,
        redirectTo: "/dashboard",
        customToken,
        data: {
          user,
          accessToken: tokens.accessToken,
          customToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── OTP: Send Login Verification Code (Passwordless) ──
authRouter.post(
  ["/request-otp", "/otp/send-login"],
  otpSendLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const email = req.body?.email;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address.",
          error: "Please enter a valid email address.",
        });
      }
      const result = await OtpService.sendLoginOtp({
        email,
        ip: req.ip,
        userAgent: req.headers["user-agent"] as string,
      });
      res.json({
        success: true,
        challengeId: result.challengeId,
        message: result.message,
        nextStep: "VERIFY_OTP",
        data: result,
      });
    } catch (error: any) {
      if (error?.status || error?.statusCode) {
        return res.status(error.status || error.statusCode).json({
          success: false,
          message: error.message,
          error: error.message,
        });
      }
      next(error);
    }
  }
);

// ─── OTP: Verify Login & Issue Session Tokens ───
authRouter.post(
  ["/verify-otp", "/otp/verify-login"],
  otpVerifyLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const email = req.body.email;
      const code = req.body.otp || req.body.code;
      const challengeId = req.body.challengeId;
      if (!email || !code || typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
        return res.status(400).json({
          success: false,
          error: "Valid email and 6-digit numeric code are required",
        });
      }
      const { user, tokens, customToken } = await OtpService.verifyLoginOtp({
        email,
        code,
        challengeId,
        ip: req.ip,
        userAgent: req.headers["user-agent"] as string,
      });

      res.cookie("accessToken", tokens.accessToken, {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        authenticated: true,
        redirectTo: "/dashboard",
        customToken,
        data: {
          user,
          accessToken: tokens.accessToken,
          customToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── OTP: Resend Verification Code ──────────────
authRouter.post(
  "/otp/resend",
  otpSendLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, purpose, password, name, role, workspaceUrl } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: "Email is required" });
      }
      const result = await OtpService.resendOtp({
        email,
        purpose: purpose || "SIGNUP",
        password,
        name,
        role,
        workspaceUrl,
        ip: req.ip,
        userAgent: req.headers["user-agent"] as string,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Password Reset: Request OTP ────────────────
authRouter.post(
  ["/otp/forgot-password", "/forgot-password"],
  passwordResetLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: "Email is required" });
      }
      const result = await OtpService.sendPasswordResetOtp({
        email,
        ip: req.ip,
        userAgent: req.headers["user-agent"] as string,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Password Reset: Verify OTP & Update Password 
authRouter.post(
  ["/otp/reset-password", "/reset-password"],
  passwordResetLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) {
        return res.status(400).json({
          success: false,
          error: "Email, 6-digit code, and new password are required",
        });
      }
      const result = await OtpService.resetPasswordWithOtp({
        email,
        code,
        newPassword,
        ip: req.ip,
        userAgent: req.headers["user-agent"] as string,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Ephemeral Test Inbox (Testing & CI Hook — Disabled in Production) ───
authRouter.get("/otp/test-inbox", (req: Request, res: Response) => {
  if (config.nodeEnv === "production") {
    return res.status(404).json({ success: false, message: "Not found" });
  }
  const email = (req.query.email as string)?.trim().toLowerCase();
  const code = email ? EmailService.getTestOtp(email) : undefined;
  res.json({ success: true, code });
});

// ─── Register ───────────────────────────────────
authRouter.post(
  "/register",
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, tokens } = await AuthService.register(req.body);

      res.cookie("accessToken", tokens.accessToken, {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        data: {
          user,
          accessToken: tokens.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Login ──────────────────────────────────────
authRouter.post(
  "/login",
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, tokens } = await AuthService.login(req.body);

      res.cookie("accessToken", tokens.accessToken, {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          user,
          accessToken: tokens.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Refresh Token (with rotation) ─────────────
authRouter.post(
  "/refresh",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken =
        req.cookies?.refreshToken ||
        req.body?.refreshToken ||
        (req.headers["x-refresh-token"] as string);
      const tokens = await AuthService.refreshToken(refreshToken);

      res.cookie("accessToken", tokens.accessToken, {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Logout ─────────────────────────────────────
authRouter.post(
  "/logout",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      await AuthService.logout(refreshToken);

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      await SecurityAuditService.logEvent({
        action: "LOGOUT",
        email: (req as any).user?.email || "authenticated-user",
        userId: (req as any).user?.userId || null,
        ip: req.ip,
        userAgent: req.headers["user-agent"] as string,
      });

      res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Get Current User ───────────────────────────
authRouter.get(
  "/me",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await AuthService.getCurrentUser(req.user!.userId);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Get Full Profile with Extended Metadata ────
authRouter.get(
  "/profile",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await AuthService.getFullProfile(req.user!.userId);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Update Profile ─────────────────────────────
authRouter.patch(
  "/profile",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, bio, title, timezone, avatar, githubUsername, themePreference } = req.body;
      const safeData = Object.fromEntries(
        Object.entries({ name, bio, title, timezone, avatar, githubUsername, themePreference }).filter(([_, v]) => v !== undefined)
      );
      const updated = await AuthService.updateProfile(req.user!.userId, safeData);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Change Password ────────────────────────────
authRouter.post(
  "/change-password",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await AuthService.changePassword(req.user!.userId, req.body);
      res.json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }
);

// ─── 2FA Setup ──────────────────────────────────
authRouter.post(
  "/2fa/setup",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const setupData = await AuthService.generate2FaSecret(req.user!.userId);
      res.json({ success: true, data: setupData });
    } catch (error) {
      next(error);
    }
  }
);

// ─── 2FA Verify & Enable ────────────────────────
authRouter.post(
  "/2fa/verify",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code } = req.body;
      const result = await AuthService.verifyAndEnable2Fa(req.user!.userId, code);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// ─── 2FA Disable ────────────────────────────────
authRouter.post(
  "/2fa/disable",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { password } = req.body;
      const result = await AuthService.disable2Fa(req.user!.userId, password);
      res.json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }
);

// ─── List Active Sessions ───────────────────────
authRouter.get(
  "/sessions",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessions = await AuthService.listSessions(req.user!.userId);
      res.json({ success: true, data: sessions });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Firebase User Sync (upsert Prisma user from Firebase token) ────
authRouter.post(
  "/firebase-sync",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, email } = req.user!;
      const { name, avatar } = req.body || {};
      const user = await AuthService.firebaseSync(userId, email, { name, avatar });
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Revoke Active Session ──────────────────────
authRouter.delete(
  "/sessions/:sessionId",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await AuthService.revokeSession(
        req.user!.userId,
        req.params.sessionId as string
      );
      res.json({ success: true, message: "Session revoked" });
    } catch (error) {
      next(error);
    }
  }
);

