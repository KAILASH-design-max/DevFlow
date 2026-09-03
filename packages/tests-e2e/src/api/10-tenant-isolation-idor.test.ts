import { describe, it, expect, apiRequest } from "../runner.js";
import { getAuthHeaders, getTestWorkspace } from "../fixtures/auth.fixture.js";

export function registerTenantIsolationIdorTests() {
  describe("API Suite 10: Multi-Tenant Isolation & IDOR Protection", () => {
    let attackerToken: string;
    let victimWorkspace: any;
    let victimProject: any;
    let victimIssue: any;

    it("setup victim and attacker accounts in isolated workspaces", async () => {
      // 1. Victim setup (Alice)
      victimWorkspace = await getTestWorkspace();
      const victimHeaders = await getAuthHeaders();

      // Get or create victim project
      const projRes = await apiRequest(`/api/projects?workspaceId=${victimWorkspace.id}`, { headers: victimHeaders });
      if (projRes.ok && projRes.data?.data?.length > 0) {
        victimProject = projRes.data.data[0];
      } else {
        const createProj = await apiRequest("/api/projects", {
          method: "POST",
          headers: victimHeaders,
          body: JSON.stringify({
            name: "Victim Secret Project",
            key: "VSP",
            workspaceId: victimWorkspace.id,
          }),
        });
        victimProject = createProj.data.data;
      }

      // Get or create victim issue
      const issueRes = await apiRequest(`/api/issues?projectId=${victimProject.id}`, { headers: victimHeaders });
      if (issueRes.ok && issueRes.data?.data?.length > 0) {
        victimIssue = issueRes.data.data[0];
      } else {
        const createIssue = await apiRequest(`/api/issues?projectId=${victimProject.id}`, {
          method: "POST",
          headers: victimHeaders,
          body: JSON.stringify({
            title: "Confidential Issue",
            type: "BUG",
            priority: "CRITICAL",
          }),
        });
        victimIssue = createIssue.data.data;
      }

      // 2. Attacker setup (Eve)
      const attackerEmail = `attacker-${Date.now()}@example.com`;
      const regRes = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: attackerEmail,
          password: "Password123",
          name: "Eve Attacker",
        }),
      });

      expect(regRes.status).toBe(201);
      attackerToken = regRes.data.data.accessToken;
    });

    it("should prevent unauthorized user from reading victim workspace", async () => {
      const res = await apiRequest(`/api/workspaces/${victimWorkspace.id}`, {
        headers: { Authorization: `Bearer ${attackerToken}` },
      });

      expect(res.status).toBe(403);
      expect(res.data.success).toBe(false);
    });

    it("should prevent unauthorized user from reading victim project issues (IDOR)", async () => {
      const res = await apiRequest(`/api/issues?projectId=${victimProject.id}`, {
        headers: { Authorization: `Bearer ${attackerToken}` },
      });

      expect(res.status).toBe(403);
      expect(res.data.success).toBe(false);
    });

    it("should prevent unauthorized user from accessing victim issue details (IDOR)", async () => {
      const res = await apiRequest(`/api/issues/${victimIssue.id}`, {
        headers: { Authorization: `Bearer ${attackerToken}` },
      });

      expect(res.status).toBe(403);
      expect(res.data.success).toBe(false);
    });

    it("should prevent unauthorized user from mutating victim issue (IDOR)", async () => {
      const res = await apiRequest(`/api/issues/${victimIssue.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${attackerToken}` },
        body: JSON.stringify({
          title: "Hacked by Attacker",
        }),
      });

      expect(res.status).toBe(403);
      expect(res.data.success).toBe(false);
    });

    it("should prevent unauthorized user from accessing victim billing subscription", async () => {
      const res = await apiRequest(`/api/billing/subscription?workspaceId=${victimWorkspace.id}`, {
        headers: { Authorization: `Bearer ${attackerToken}` },
      });

      expect(res.status).toBe(403);
      expect(res.data.success).toBe(false);
    });
  });
}
