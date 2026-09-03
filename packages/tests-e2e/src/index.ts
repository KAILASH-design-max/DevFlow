/**
 * DevFlow Master E2E & Integration Test Suite Entrypoint
 */

import { runAllTests } from "./runner.js";

// API Integration Suites
import { registerAuthProfileTests } from "./api/01-auth-profile.test.js";
import { registerSecurity2FaTests } from "./api/02-security-2fa-sessions.test.js";
import { registerWorkspacesRbacTests } from "./api/03-workspaces-rbac.test.js";
import { registerProjectsCatalogTests } from "./api/04-projects-catalog.test.js";
import { registerIssuesCommentsTests } from "./api/05-issues-comments.test.js";
import { registerSprintsBurndownTests } from "./api/06-sprints-burndown.test.js";
import { registerGithubWebhooksTests } from "./api/07-github-webhooks.test.js";
import { registerAnalyticsDoraTests } from "./api/08-analytics-dora.test.js";
import { registerNotificationsBillingTests } from "./api/09-notifications-billing.test.js";
import { registerTenantIsolationIdorTests } from "./api/10-tenant-isolation-idor.test.js";
import { registerPaymentWebhooksTests } from "./api/11-payment-webhooks.test.js";

// Browser & UI Flow Suites
import { registerNavigationRoutesTests } from "./browser/01-navigation-routes.test.js";
import { registerDashboardKpisTests } from "./browser/02-dashboard-kpis.test.js";
import { registerKanbanBoardTests } from "./browser/03-kanban-board.test.js";
import { registerTeamRbacTests } from "./browser/04-team-rbac-matrix.test.js";
import { registerSettingsTabsTests } from "./browser/05-settings-tabs.test.js";

async function main() {
  const args = process.argv.slice(2);
  const runOnlyApi = args.includes("--api");
  const runOnlyBrowser = args.includes("--browser");

  if (!runOnlyBrowser) {
    registerAuthProfileTests();
    registerSecurity2FaTests();
    registerWorkspacesRbacTests();
    registerProjectsCatalogTests();
    registerIssuesCommentsTests();
    registerSprintsBurndownTests();
    registerGithubWebhooksTests();
    registerAnalyticsDoraTests();
    registerNotificationsBillingTests();
    registerTenantIsolationIdorTests();
    registerPaymentWebhooksTests();
  }

  if (!runOnlyApi) {
    registerNavigationRoutesTests();
    registerDashboardKpisTests();
    registerKanbanBoardTests();
    registerTeamRbacTests();
    registerSettingsTabsTests();
  }

  const results = await runAllTests();
  if (!results.passed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test runner execution failed:", err);
  process.exit(1);
});
