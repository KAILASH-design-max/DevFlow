import { describe, it, expect, webRequest } from "../runner.js";

export function registerNavigationRoutesTests() {
  describe("Browser Suite 01: Core Routes & Subroute Resolution", () => {
    const mainRoutes = [
      { path: "/dashboard", name: "Dashboard Overview" },
      { path: "/dashboard/projects", name: "Projects Directory" },
      { path: "/dashboard/issues", name: "Issues Roster" },
      { path: "/dashboard/sprints", name: "Sprints Milestones" },
      { path: "/dashboard/team", name: "Team & RBAC Hub" },
      { path: "/dashboard/analytics", name: "Engineering Analytics" },
      { path: "/dashboard/github", name: "GitHub & VCS Integration" },
      { path: "/dashboard/settings", name: "Workspace Settings" },
      { path: "/dashboard/board", name: "Kanban Board" },
      { path: "/dashboard/prs", name: "Pull Requests" },
      { path: "/dashboard/deployments", name: "Deployments" },
      { path: "/dashboard/notifications", name: "Notification Center" },
      { path: "/dashboard/billing", name: "Billing & Plans" },
    ];

    for (const route of mainRoutes) {
      it(`should return HTTP 200 OK for ${route.name} (${route.path})`, async () => {
        const res = await webRequest(route.path);
        expect(res.status).toBe(200);
        expect(res.html.length).toBeGreaterThan(100);
      });
    }

    const settingsSubroutes = [
      { path: "/settings/profile", name: "Profile Redirect" },
      { path: "/settings/security", name: "Security Redirect" },
      { path: "/settings/preferences", name: "Preferences Redirect" },
      { path: "/settings/workspace", name: "Workspace Redirect" },
      { path: "/settings/members", name: "Members Redirect" },
      { path: "/settings/notifications", name: "Notifications Redirect" },
      { path: "/settings/billing", name: "Billing Redirect" },
    ];

    for (const sub of settingsSubroutes) {
      it(`should return HTTP 200 OK for subroute ${sub.name} (${sub.path})`, async () => {
        const res = await webRequest(sub.path);
        expect(res.status).toBe(200);
      });
    }
  });
}
