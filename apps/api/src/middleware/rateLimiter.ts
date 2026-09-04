import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { config } from "../config/index.js";

/**
 * Rate Limiter configuration for Authentication & OTP operations.
 * Allows Redis / memory store abstraction.
 */

const isLocalDevOrTest = (req: Request) => {
  if (req.headers["x-test-rate-limit"] === "true") {
    return false; // Force rate limit during explicit rate-limit tests
  }
  return config.nodeEnv !== "production" && (req.ip === "127.0.0.1" || req.ip === "::1" || req.ip === "::ffff:127.0.0.1");
};

// 1. General Auth Endpoints (Login, Signup): 15 attempts per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  skip: isLocalDevOrTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many authentication requests from this IP. Please try again after 15 minutes.",
  },
  keyGenerator: (req: Request) => {
    return (req.ip || req.socket.remoteAddress || "global-auth") as string;
  },
});

// 2. OTP Send Operations: Max 5 OTP requests per 15 minutes per IP + email
export const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skip: isLocalDevOrTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many verification code requests. Please wait before requesting another code.",
  },
  keyGenerator: (req: Request) => {
    const email = req.body?.email ? req.body.email.trim().toLowerCase() : "";
    return `${req.ip || "ip"}:${email}`;
  },
});

// 3. OTP Verify Operations: Max 10 attempts per 15 minutes per IP + email
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: isLocalDevOrTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many verification attempts. Please wait before trying again.",
  },
  keyGenerator: (req: Request) => {
    const email = req.body?.email ? req.body.email.trim().toLowerCase() : "";
    return `${req.ip || "ip"}:${email}`;
  },
});

// 4. Password Reset Requests: Max 5 requests per 15 minutes
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skip: isLocalDevOrTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many password reset requests. Please try again after 15 minutes.",
  },
  keyGenerator: (req: Request) => {
    return (req.ip || "reset-ip") as string;
  },
});
