import { Router, Request, Response, NextFunction } from "express";
import { config } from "../../config/index.js";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/auth.js";
import { registerSchema, loginSchema } from "@devflow/shared";
import { AuthService } from "./auth.service.js";

export const authRouter = Router();

// ─── Register ───────────────────────────────────
authRouter.post(
  "/register",
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, tokens } = await AuthService.register(req.body);

      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "strict",
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

      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "strict",
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
      const refreshToken = req.cookies?.refreshToken;
      const tokens = await AuthService.refreshToken(refreshToken);

      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: { accessToken: tokens.accessToken },
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

      res.clearCookie("refreshToken");
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
      const { name, bio, phone, company, location, website } = req.body;
      const safeData = Object.fromEntries(
        Object.entries({ name, bio, phone, company, location, website }).filter(([_, v]) => v !== undefined)
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

