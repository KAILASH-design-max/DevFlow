import { describe, it, expect, apiRequest } from "../runner.js";
import { getAuthHeaders, setCachedToken } from "../fixtures/auth.fixture.js";

export function registerAuthProfileTests() {
  describe("API Suite 01: Authentication & User Profile", () => {
    it("should authenticate with valid user credentials and return JWT tokens", async () => {
      const res = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "alice@devflow.io",
          password: "Password123",
        }),
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty("accessToken");
      expect(res.data.data).toHaveProperty("user");
      expect(res.data.data.user.email).toBe("alice@devflow.io");
      setCachedToken(res.data.data.accessToken);
    });

    it("should reject login with invalid password", async () => {
      const res = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "alice@devflow.io",
          password: "WrongPassword999!",
        }),
      });

      expect(res.status).toBe(401);
      expect(res.data.success).toBe(false);
    });

    it("should fetch full authenticated user profile", async () => {
      const headers = await getAuthHeaders();
      const res = await apiRequest("/api/auth/profile", { headers });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.email).toBe("alice@devflow.io");
    });

    it("should update user profile details (title, bio, timezone)", async () => {
      const headers = await getAuthHeaders();
      const updateData = {
        name: "Alice Chen (Staff)",
        title: "Principal Infrastructure Lead",
        bio: "Driving modern developer productivity platforms",
        timezone: "America/New_York",
      };

      const res = await apiRequest("/api/auth/profile", {
        method: "PATCH",
        headers,
        body: JSON.stringify(updateData),
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.name).toBe(updateData.name);
      expect(res.data.data.title).toBe(updateData.title);
      expect(res.data.data.bio).toBe(updateData.bio);
      expect(res.data.data.timezone).toBe(updateData.timezone);
    });
  });
}
