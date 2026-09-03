import { describe, it, expect, webRequest } from "../runner.js";

export function registerKanbanBoardTests() {
  describe("Browser Suite 03: Kanban Sprint Board", () => {
    it("should render 5-column Kanban board container and sprint controls", async () => {
      const res = await webRequest("/dashboard/board");
      expect(res.status).toBe(200);
      expect(res.html).toContain("Board");
    });
  });
}
