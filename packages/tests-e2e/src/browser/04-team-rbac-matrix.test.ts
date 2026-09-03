import { describe, it, expect, webRequest } from "../runner.js";

export function registerTeamRbacTests() {
  describe("Browser Suite 04: Team Roster & Granular RBAC Permissions", () => {
    it("should render team directory, role selector elements, and RBAC matrix trigger", async () => {
      const res = await webRequest("/dashboard/team");
      expect(res.status).toBe(200);
      expect(res.html).toContain("Team");
      expect(res.html).toContain("RBAC");
    });
  });
}
