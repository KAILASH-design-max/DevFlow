import { describe, it, expect, apiRequest } from "../runner.js";
import { getAuthHeaders } from "../fixtures/auth.fixture.js";

export function registerNotificationsBillingTests() {
  describe("API Suite 09: Notifications Center & Subscriptions", () => {
    it("should fetch user notification items list", async () => {
      const headers = await getAuthHeaders();
      const res = await apiRequest("/api/notifications", { headers });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it("should retrieve unread notifications count", async () => {
      const headers = await getAuthHeaders();
      const res = await apiRequest("/api/notifications/unread-count", { headers });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty("unreadCount");
    });

    it("should mark all user notifications as read", async () => {
      const headers = await getAuthHeaders();
      const res = await apiRequest("/api/notifications/read-all", {
        method: "PATCH",
        headers,
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });
  });
}
