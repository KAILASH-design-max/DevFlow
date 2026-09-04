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
import { registerOtpVerificationTests } from "./api/12-otp-verification.test.js";

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
  const suiteArg = args.find((a) => a.startsWith("--suite="));
  const suiteFilter = suiteArg ? suiteArg.split("=")[1] : null;

  if (suiteFilter) {
    if (suiteFilter === "1" || suiteFilter === "auth") registerAuthProfileTests();
    else if (suiteFilter === "2" || suiteFilter === "2fa") registerSecurity2FaTests();
    else if (suiteFilter === "3" || suiteFilter === "rbac") registerWorkspacesRbacTests();
    else if (suiteFilter === "4" || suiteFilter === "projects") registerProjectsCatalogTests();
    else if (suiteFilter === "5" || suiteFilter === "issues") registerIssuesCommentsTests();
    else if (suiteFilter === "6" || suiteFilter === "sprints") registerSprintsBurndownTests();
    else if (suiteFilter === "7" || suiteFilter === "github") registerGithubWebhooksTests();
    else if (suiteFilter === "8" || suiteFilter === "analytics") registerAnalyticsDoraTests();
    else if (suiteFilter === "9" || suiteFilter === "notifications") registerNotificationsBillingTests();
    else if (suiteFilter === "10" || suiteFilter === "tenant") registerTenantIsolationIdorTests();
    else if (suiteFilter === "11" || suiteFilter === "webhooks") registerPaymentWebhooksTests();
    else if (suiteFilter === "12" || suiteFilter === "otp") registerOtpVerificationTests();
    else if (suiteFilter === "b1") registerNavigationRoutesTests();
    else if (suiteFilter === "b2") registerDashboardKpisTests();
    else if (suiteFilter === "b3") registerKanbanBoardTests();
    else if (suiteFilter === "b4") registerTeamRbacTests();
    else if (suiteFilter === "b5") registerSettingsTabsTests();
  } else {
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
      registerOtpVerificationTests();
    }

    if (!runOnlyApi) {
      registerNavigationRoutesTests();
      registerDashboardKpisTests();
      registerKanbanBoardTests();
      registerTeamRbacTests();
      registerSettingsTabsTests();
    }
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
