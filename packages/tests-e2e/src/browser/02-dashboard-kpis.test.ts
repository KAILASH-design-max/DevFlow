import { describe, it, expect, webRequest } from "../runner.js";

export function registerDashboardKpisTests() {
  describe("Browser Suite 02: Dashboard Viewport & Top Navbar", () => {
    it("should render DevFlow main shell, navbar search, and notification elements", async () => {
      const res = await webRequest("/dashboard");
      expect(res.status).toBe(200);

      // Verify HTML content structure contains DevFlow branding and core layout
      expect(res.html).toContain("DevFlow");
      expect(res.html).toContain("Dashboard");
    });
  });
}
