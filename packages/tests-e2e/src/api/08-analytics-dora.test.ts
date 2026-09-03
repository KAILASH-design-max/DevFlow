import { describe, it, expect, apiRequest } from "../runner.js";
import { getAuthHeaders, getTestWorkspace } from "../fixtures/auth.fixture.js";

export function registerAnalyticsDoraTests() {
  describe("API Suite 08: Engineering Analytics & DORA Metrics", () => {
    it("should retrieve dashboard aggregate statistics", async () => {
      const headers = await getAuthHeaders();
      const ws = await getTestWorkspace();

      const res = await apiRequest(`/api/dashboard/stats?workspaceId=${ws.id}`, { headers });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty("totalIssues");
      expect(res.data.data).toHaveProperty("openBugs");
      expect(res.data.data).toHaveProperty("activeSprints");
      expect(res.data.data).toHaveProperty("teamMembers");
    });

    it("should retrieve recent workspace activity stream", async () => {
      const headers = await getAuthHeaders();
      const ws = await getTestWorkspace();

      const res = await apiRequest(`/api/dashboard/activity?workspaceId=${ws.id}`, { headers });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });
  });
}
