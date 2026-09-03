import { describe, it, expect, webRequest } from "../runner.js";

export function registerSettingsTabsTests() {
  describe("Browser Suite 05: Account & Workspace Settings Tabs", () => {
    it("should render settings layout with profile, security, and preferences panels", async () => {
      const res = await webRequest("/dashboard/settings");
      expect(res.status).toBe(200);
      expect(res.html).toContain("Settings");
      expect(res.html).toContain("Profile");
      expect(res.html).toContain("Security");
      expect(res.html).toContain("Preferences");
    });
  });
}
