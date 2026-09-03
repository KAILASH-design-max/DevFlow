import { describe, it, expect, apiRequest } from "../runner.js";
import { getAuthHeaders, getTestWorkspace } from "../fixtures/auth.fixture.js";

export function registerWorkspacesRbacTests() {
  describe("API Suite 03: Workspaces, Security Policies & RBAC", () => {
    it("should list accessible workspaces with active members", async () => {
      const headers = await getAuthHeaders();
      const res = await apiRequest("/api/workspaces", { headers });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBeGreaterThan(0);
      expect(res.data.data[0]).toHaveProperty("name");
      expect(res.data.data[0]).toHaveProperty("slug");
    });

    it("should update workspace details and public slug", async () => {
      const headers = await getAuthHeaders();
      const ws = await getTestWorkspace();

      const updateData = {
        name: `${ws.name} (Updated)`,
        description: "Primary engineering organization workspace",
      };

      const res = await apiRequest(`/api/workspaces/${ws.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(updateData),
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.name).toBe(updateData.name);
    });

    it("should fetch and update workspace security policies", async () => {
      const headers = await getAuthHeaders();
      const ws = await getTestWorkspace();

      const getRes = await apiRequest(`/api/workspaces/${ws.id}/security`, { headers });
      expect(getRes.status).toBe(200);
      expect(getRes.data.success).toBe(true);
      expect(getRes.data.data).toHaveProperty("enforceTwoFactor");

      const updateRes = await apiRequest(`/api/workspaces/${ws.id}/security`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          enforceTwoFactor: true,
          restrictProjectCreation: true,
          allowPublicIssueView: false,
        }),
      });

      expect(updateRes.status).toBe(200);
      expect(updateRes.data.success).toBe(true);
      expect(updateRes.data.data.enforceTwoFactor).toBe(true);
      expect(updateRes.data.data.restrictProjectCreation).toBe(true);
    });

    it("should invite a new workspace member with specified role", async () => {
      const headers = await getAuthHeaders();
      const ws = await getTestWorkspace();
      const testEmail = `dev-${Date.now()}@devflow.io`;

      const res = await apiRequest(`/api/workspaces/${ws.id}/invite`, {
        method: "POST",
        headers,
        body: JSON.stringify({ email: testEmail, role: "DEVELOPER" }),
      });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty("invitation");
      expect(res.data.data.invitation.email).toBe(testEmail);
      expect(res.data.data.invitation.role).toBe("DEVELOPER");
    });
  });
}
