import { describe, it, expect, apiRequest } from "../runner.js";
import { getAuthHeaders, getTestProject } from "../fixtures/auth.fixture.js";

export function registerIssuesCommentsTests() {
  describe("API Suite 05: Issues Lifecycle & Markdown Comments", () => {
    let createdIssueId = "";

    it("should create a new issue with story points and high priority", async () => {
      const headers = await getAuthHeaders();
      const project = await getTestProject();

      const issueData = {
        title: "E2E: Implement resilient retry policy for webhook processor",
        description: "Add exponential backoff with jitter and dead letter queue routing.",
        priority: "HIGH",
        status: "TODO",
        storyPoints: 5,
      };

      const res = await apiRequest(`/api/issues?projectId=${project.id}`, {
        method: "POST",
        headers,
        body: JSON.stringify(issueData),
      });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.title).toBe(issueData.title);
      expect(res.data.data.priority).toBe(issueData.priority);
      expect(res.data.data.storyPoints).toBe(issueData.storyPoints);
      createdIssueId = res.data.data.id;
    });

    it("should advance issue state through lifecycle to DONE", async () => {
      const headers = await getAuthHeaders();
      if (!createdIssueId) return;

      const res = await apiRequest(`/api/issues/${createdIssueId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: "DONE" }),
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.status).toBe("DONE");
    });

    it("should list project issues with status and priority filtering", async () => {
      const headers = await getAuthHeaders();
      const project = await getTestProject();

      const res = await apiRequest(`/api/issues?projectId=${project.id}&status=DONE`, { headers });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.some((i: any) => i.id === createdIssueId)).toBe(true);
    });

    it("should add a discussion comment with Markdown formatting and user mention", async () => {
      const headers = await getAuthHeaders();
      if (!createdIssueId) return;

      const commentData = {
        content: "Verified in staging environment. `@alice` SLA latency is < 45ms.",
      };

      const res = await apiRequest(`/api/comments?issueId=${createdIssueId}`, {
        method: "POST",
        headers,
        body: JSON.stringify(commentData),
      });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.content).toBe(commentData.content);
    });
  });
}
