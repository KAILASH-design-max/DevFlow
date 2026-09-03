import { describe, it, expect, apiRequest } from "../runner.js";
import { getAuthHeaders } from "../fixtures/auth.fixture.js";

export function registerSecurity2FaTests() {
  describe("API Suite 02: Security, 2FA & Active Sessions", () => {
    it("should generate TOTP 2FA secret and scanable QR code", async () => {
      const headers = await getAuthHeaders();
      const res = await apiRequest("/api/auth/2fa/setup", {
        method: "POST",
        headers,
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty("secret");
      expect(res.data.data).toHaveProperty("qrCodeUrl");
      expect(res.data.data).toHaveProperty("recoveryCodes");
      expect(res.data.data.recoveryCodes.length).toBe(8);
    });

    it("should reject invalid 6-digit TOTP verification code", async () => {
      const headers = await getAuthHeaders();
      const res = await apiRequest("/api/auth/2fa/verify", {
        method: "POST",
        headers,
        body: JSON.stringify({ code: "000000" }),
      });

      expect(res.status).toBe(400);
      expect(res.data.success).toBe(false);
    });

    it("should retrieve active login sessions list", async () => {
      const headers = await getAuthHeaders();
      const res = await apiRequest("/api/auth/sessions", { headers });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBeGreaterThan(0);
      expect(res.data.data[0]).toHaveProperty("device");
      expect(res.data.data[0]).toHaveProperty("ip");
      expect(res.data.data[0]).toHaveProperty("isCurrent");
    });

    it("should revoke a specific inactive session", async () => {
      const headers = await getAuthHeaders();
      const sessionsRes = await apiRequest("/api/auth/sessions", { headers });
      const inactive = sessionsRes.data.data.find((s: any) => !s.isCurrent);

      if (inactive) {
        const revokeRes = await apiRequest(`/api/auth/sessions/${inactive.id}`, {
          method: "DELETE",
          headers,
        });

        expect(revokeRes.status).toBe(200);
        expect(revokeRes.data.success).toBe(true);
      }
    });

    it("should reject password change when current password is wrong", async () => {
      const headers = await getAuthHeaders();
      const res = await apiRequest("/api/auth/change-password", {
        method: "POST",
        headers,
        body: JSON.stringify({
          currentPassword: "IncorrectCurrentPassword!",
          newPassword: "NewSecretPassword123!",
        }),
      });

      expect(res.status).toBe(400);
      expect(res.data.success).toBe(false);
    });
  });
}
