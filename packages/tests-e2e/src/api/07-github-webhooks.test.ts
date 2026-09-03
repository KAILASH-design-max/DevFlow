import { describe, it, expect, apiRequest } from "../runner.js";
import { getAuthHeaders, getTestProject } from "../fixtures/auth.fixture.js";

export function registerGithubWebhooksTests() {
  describe("API Suite 07: GitHub Integration & Webhook Receiver", () => {
    it("should retrieve project connected repository status", async () => {
      const headers = await getAuthHeaders();
      const project = await getTestProject();

      const res = await apiRequest(`/api/github/projects/${project.id}/repository`, { headers });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });

    it("should handle project pull requests sync operation", async () => {
      const headers = await getAuthHeaders();
      const project = await getTestProject();

      const res = await apiRequest(`/api/github/projects/${project.id}/sync-prs`, {
        method: "POST",
        headers,
      });

      // Returns 200 with PR array if repo connected, or 404 if not yet linked
      expect(res.status === 200 || res.status === 404).toBe(true);
    });

    it("should reject unauthorized pull_request webhook missing valid HMAC signature", async () => {
      const res = await apiRequest("/api/github/webhook", {
        method: "POST",
        headers: {
          "x-github-event": "pull_request",
          "x-hub-signature-256": "sha256=invalid_tampered_signature_payload",
        },
        body: JSON.stringify({
          action: "opened",
          repository: { full_name: "devflow-org/core" },
          pull_request: { number: 42, title: "feat: retry pipeline" },
        }),
      });

      expect(res.status).toBe(401);
      expect(res.data.success).toBe(false);
    });
  });
}
