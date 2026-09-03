import { describe, it, expect, apiRequest } from "../runner.js";
import { getAuthHeaders, getTestProject } from "../fixtures/auth.fixture.js";

export function registerSprintsBurndownTests() {
  describe("API Suite 06: Sprints & Velocity Burndown Progress", () => {
    let createdSprintId = "";

    it("should create a new sprint milestone with 14-day duration", async () => {
      const headers = await getAuthHeaders();
      const project = await getTestProject();

      const startDate = new Date();
      const endDate = new Date(Date.now() + 14 * 86400000);

      const sprintData = {
        name: "Sprint 20 - Resilient Core",
        goal: "Deploy automated retry pipeline and multi-region read replicas",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      const res = await apiRequest(`/api/sprints?projectId=${project.id}`, {
        method: "POST",
        headers,
        body: JSON.stringify(sprintData),
      });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.name).toBe(sprintData.name);
      expect(res.data.data.status).toBe("PLANNING");
      createdSprintId = res.data.data.id;
    });

    it("should transition sprint status to ACTIVE", async () => {
      const headers = await getAuthHeaders();
      if (!createdSprintId) return;

      const res = await apiRequest(`/api/sprints/${createdSprintId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: "ACTIVE" }),
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.status).toBe("ACTIVE");
    });

    it("should fetch detailed sprint with burndown points and capacity metrics", async () => {
      const headers = await getAuthHeaders();
      if (!createdSprintId) return;

      const res = await apiRequest(`/api/sprints/${createdSprintId}`, { headers });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty("burndown");
      expect(res.data.data).toHaveProperty("assigneeCapacity");
      expect(Array.isArray(res.data.data.burndown)).toBe(true);
      expect(res.data.data.burndown.length).toBeGreaterThanOrEqual(7);
    });
  });
}
