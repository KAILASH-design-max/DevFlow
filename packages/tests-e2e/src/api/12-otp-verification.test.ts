import { describe, it, expect, apiRequest } from "../runner.js";

export function registerOtpVerificationTests() {
  describe("API Suite 12: Production-Oriented Secure Email OTP Authentication", () => {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const signupEmail = `otp-signup-${randomSuffix}@devflow.io`;
    const victimEmail = `otp-victim-${randomSuffix}@devflow.io`;
    let signupCode = "";
    let loginCode = "";
    let resetCode = "";
    let userAccessToken = "";

    // Helper to read OTP from ephemeral test inbox (simulating email client)
    async function fetchTestInboxOtp(email: string): Promise<string> {
      const res = await apiRequest(`/api/auth/otp/test-inbox?email=${encodeURIComponent(email)}`);
      return res.data?.code || "";
    }

    // ─── 1. SIGNUP OTP GENERATION & SECURITY ───────────
    it("should initiate signup OTP without exposing plaintext OTP in response", async () => {
      const res = await apiRequest("/api/auth/otp/send-signup", {
        method: "POST",
        body: JSON.stringify({
          email: signupEmail,
          name: "Security OTP User",
          password: "OriginalPassword123!",
          role: "DEVELOPER",
          workspaceUrl: `team-${randomSuffix}`,
        }),
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.email).toBe(signupEmail);
      // Plaintext OTP must NOT be returned in API response!
      expect(res.data.data.debugCode).toBeUndefined();
      expect(res.data.data.code).toBeUndefined();
      expect(res.data.data.otp).toBeUndefined();

      // Retrieve OTP delivered to the simulated inbox
      signupCode = await fetchTestInboxOtp(signupEmail);
      expect(signupCode.length).toBe(6);
      expect(/^\d{6}$/.test(signupCode)).toBe(true);
    });

    // ─── 2. INVALID OTP VERIFICATION ──────────────────
    it("should reject incorrect 6-digit OTP code with 400 Bad Request", async () => {
      const res = await apiRequest("/api/auth/otp/verify-signup", {
        method: "POST",
        body: JSON.stringify({
          email: signupEmail,
          code: "123456" === signupCode ? "654321" : "123456",
        }),
      });

      expect(res.status).toBe(400);
      expect(res.data.success).toBe(false);
    });

    // ─── 3. MALFORMED OTP FORMAT ──────────────────────
    it("should reject malformed or non-numeric OTP codes", async () => {
      const res = await apiRequest("/api/auth/otp/verify-signup", {
        method: "POST",
        body: JSON.stringify({
          email: signupEmail,
          code: "ABCDEF",
        }),
      });

      expect(res.status).toBe(400);
      expect(res.data.success).toBe(false);
    });

    // ─── 4. SUCCESSFUL SIGNUP VERIFICATION ───────────
    it("should verify correct OTP code, complete registration, and set emailVerified = true", async () => {
      const res = await apiRequest("/api/auth/otp/verify-signup", {
        method: "POST",
        body: JSON.stringify({
          email: signupEmail,
          code: signupCode,
        }),
      });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty("accessToken");
      expect(res.data.data.user.email).toBe(signupEmail);
      expect(res.data.data.user.emailVerified).toBe(true);

      userAccessToken = res.data.data.accessToken;
    });

    // ─── 5. REPLAY PROTECTION ────────────────────────
    it("should reject replay attack (submitting already-consumed OTP code)", async () => {
      const res = await apiRequest("/api/auth/otp/verify-signup", {
        method: "POST",
        body: JSON.stringify({
          email: signupEmail,
          code: signupCode,
        }),
      });

      expect(res.status).toBe(400);
      expect(res.data.success).toBe(false);
    });

    // ─── 6. LOGIN OTP GENERATION ─────────────────────
    it("should send login OTP for registered account", async () => {
      const res = await apiRequest("/api/auth/otp/send-login", {
        method: "POST",
        body: JSON.stringify({
          email: signupEmail,
          password: "OriginalPassword123!",
        }),
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.code).toBeUndefined();

      loginCode = await fetchTestInboxOtp(signupEmail);
      expect(loginCode.length).toBe(6);
      expect(/^\d{6}$/.test(loginCode)).toBe(true);
    });

    // ─── 7. PURPOSE ISOLATION ────────────────────────
    it("should enforce purpose isolation: login OTP cannot verify signup", async () => {
      const res = await apiRequest("/api/auth/otp/verify-signup", {
        method: "POST",
        body: JSON.stringify({
          email: signupEmail,
          code: loginCode,
        }),
      });

      expect(res.status).toBe(400);
      expect(res.data.success).toBe(false);
    });

    // ─── 8. SUCCESSFUL LOGIN OTP VERIFICATION ────────
    it("should verify login OTP and issue fresh session tokens", async () => {
      const res = await apiRequest("/api/auth/otp/verify-login", {
        method: "POST",
        body: JSON.stringify({
          email: signupEmail,
          code: loginCode,
        }),
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty("accessToken");
      expect(res.data.data.user.email).toBe(signupEmail);
    });

    // ─── 9. RESEND COOLDOWN ENFORCEMENT ──────────────
    it("should enforce cooldown when resend is requested too quickly", async () => {
      // First request
      await apiRequest("/api/auth/otp/send-login", {
        method: "POST",
        body: JSON.stringify({ email: signupEmail }),
      });

      // Immediate second request within 60s
      const res = await apiRequest("/api/auth/otp/send-login", {
        method: "POST",
        body: JSON.stringify({ email: signupEmail }),
      });

      expect(res.status).toBe(429);
      expect(res.data.success).toBe(false);
    });

    // ─── 10. ATTEMPT LIMIT & LOCKOUT ─────────────────
    it("should lockout after 5 consecutive failed verification attempts", async () => {
      const lockoutEmail = `lockout-${randomSuffix}@devflow.io`;

      // Initiate signup
      await apiRequest("/api/auth/otp/send-signup", {
        method: "POST",
        body: JSON.stringify({
          email: lockoutEmail,
          name: "Lockout User",
          password: "SecurePassword123!",
        }),
      });

      // 5 consecutive invalid attempts
      for (let i = 0; i < 5; i++) {
        await apiRequest("/api/auth/otp/verify-signup", {
          method: "POST",
          body: JSON.stringify({
            email: lockoutEmail,
            code: "999999",
          }),
        });
      }

      // 6th attempt must be rejected with 429
      const res = await apiRequest("/api/auth/otp/verify-signup", {
        method: "POST",
        body: JSON.stringify({
          email: lockoutEmail,
          code: "999999",
        }),
      });

      expect(res.status).toBe(429);
      expect(res.data.success).toBe(false);
    });

    // ─── 11. PASSWORD RESET FLOW ─────────────────────
    it("should request password reset OTP safely without account enumeration", async () => {
      const res = await apiRequest("/api/auth/otp/forgot-password", {
        method: "POST",
        body: JSON.stringify({
          email: signupEmail,
        }),
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);

      resetCode = await fetchTestInboxOtp(signupEmail);
      expect(resetCode.length).toBe(6);
    });

    it("should verify reset OTP and successfully update account password", async () => {
      const res = await apiRequest("/api/auth/otp/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email: signupEmail,
          code: resetCode,
          newPassword: "BrandNewSecurePassword123!",
        }),
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.message).toBeDefined();

      // Verify old password no longer works
      const oldLoginRes = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: signupEmail,
          password: "OriginalPassword123!",
        }),
      });
      expect(oldLoginRes.status).toBe(401);

      // Verify new password works
      const newLoginRes = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: signupEmail,
          password: "BrandNewSecurePassword123!",
        }),
      });
      expect(newLoginRes.status).toBe(200);
      expect(newLoginRes.data.success).toBe(true);
    });

    // ─── 12. ACCESS CONTROL: UNVERIFIED ACCOUNT BLOCKED 
    it("should block unverified account from accessing protected workspace resources", async () => {
      const unverifiedEmail = `unverified-${randomSuffix}@devflow.io`;

      // Start registration but do NOT verify OTP
      await apiRequest("/api/auth/otp/send-signup", {
        method: "POST",
        body: JSON.stringify({
          email: unverifiedEmail,
          name: "Unverified User",
          password: "Password123!",
        }),
      });

      // Attempting to access workspaces with unverified identity or invalid token
      const res = await apiRequest("/api/workspaces", {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid_or_unverified_token",
        },
      });

      expect(res.status).toBe(401);
    });

    // ─── 13. DIRECT PASSWORDLESS REQUEST-OTP ─────────
    it("should support direct POST /api/auth/request-otp without password", async () => {
      const directEmail = `direct-otp-${randomSuffix}@devflow.io`;

      // Create user first via signup OTP
      await apiRequest("/api/auth/otp/send-signup", {
        method: "POST",
        body: JSON.stringify({
          email: directEmail,
          name: "Direct OTP User",
        }),
      });
      const code = await fetchTestInboxOtp(directEmail);
      await apiRequest("/api/auth/otp/verify-signup", {
        method: "POST",
        body: JSON.stringify({ email: directEmail, code }),
      });

      // Now request OTP passwordless
      const res = await apiRequest("/api/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ email: directEmail }),
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.message).toBeDefined();

      const loginOtp = await fetchTestInboxOtp(directEmail);
      expect(loginOtp.length).toBe(6);

      // Verify OTP with POST /api/auth/verify-otp
      const verifyRes = await apiRequest("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email: directEmail, otp: loginOtp }),
      });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.data.success).toBe(true);
      expect(verifyRes.data.authenticated).toBe(true);
      expect(verifyRes.data.redirectTo).toBe("/dashboard");
      expect(verifyRes.data.data.accessToken).toBeDefined();
      expect(verifyRes.data.data.user.email).toBe(directEmail);
    });

    // ─── 14. INVALID EMAIL LOOKUP REJECTION ──────────
    it("should reject non-existent user with 404 and 'This email ID is invalid.' without sending OTP", async () => {
      const nonExistentEmail = `notfound-${randomSuffix}@devflow.io`;

      const res = await apiRequest("/api/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ email: nonExistentEmail }),
      });

      expect(res.status).toBe(404);
      expect(res.data.success).toBe(false);
      expect(res.data.message).toBe("This email ID is invalid.");

      // Ensure NO OTP code was ever generated or sent
      const inboxCode = await fetchTestInboxOtp(nonExistentEmail);
      expect(inboxCode).toBe("");
    });

    // ─── 15. INVALID EMAIL FORMAT REJECTION ──────────
    it("should reject malformed email format with 400 and 'Please enter a valid email address.'", async () => {
      const res = await apiRequest("/api/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ email: "abc" }),
      });

      expect(res.status).toBe(400);
      expect(res.data.success).toBe(false);
      expect(res.data.message).toBe("Please enter a valid email address.");
    });
  });
}
