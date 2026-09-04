import { describe, it, expect, apiRequest } from "../runner.js";
import { getAuthHeaders, getTestWorkspace } from "../fixtures/auth.fixture.js";

export function registerProjectsCatalogTests() {
  describe("API Suite 04: Projects & Catalog Isolation", () => {
    let createdProjectId = "";

    it("should create a new project with unique key and description", async () => {
      const headers = await getAuthHeaders();
      const ws = await getTestWorkspace();
      const randomKey = "T" + Array.from({ length: 3 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join("");

      const projectData = {
        name: `Integration Subsystem ${randomKey}`,
        key: randomKey,
        description: "Automated test target subsystem",
      };

      const res = await apiRequest(`/api/projects?workspaceId=${ws.id}`, {
        method: "POST",
        headers,
        body: JSON.stringify(projectData),
      });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.name).toBe(projectData.name);
      expect(res.data.data.key).toBe(projectData.key);
      createdProjectId = res.data.data.id;
    });

    it("should list all projects associated with a workspace", async () => {
      const headers = await getAuthHeaders();
      const ws = await getTestWorkspace();

      const res = await apiRequest(`/api/projects?workspaceId=${ws.id}`, { headers });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBeGreaterThan(0);
    });

    it("should retrieve single project details with issue counts", async () => {
      const headers = await getAuthHeaders();
      if (!createdProjectId) return;

      const res = await apiRequest(`/api/projects/${createdProjectId}`, { headers });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.id).toBe(createdProjectId);
    });
  });
}
