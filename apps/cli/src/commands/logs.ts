import { Command } from "commander";
import ora from "ora";
import { config, createApiClient, requireAuth } from "../lib/config.js";
import { c, printError, printDim } from "../ui/banner.js";
import { renderLogsTable } from "../ui/tables.js";

export const logsCommand = new Command("logs")
  .description("View DevFlow audit & activity logs")
  // ── AUDIT ─────────────────────────────────────────────────────────────────
  .addCommand(
    new Command("audit")
      .description("View audit logs for a project or workspace")
      .option("-p, --project <id>", "Filter by project ID")
      .option("-w, --workspace <id>", "Filter by workspace ID")
      .option("-a, --actor <userId>", "Filter by actor user ID")
      .option("-l, --limit <n>", "Max entries to show", "30")
      .option("--since <date>", "Show logs since date (e.g. 2024-01-01)")
      .action(async (opts) => {
        requireAuth();
        const projectId = opts.project ?? config.get("projectId");
        const workspaceId = opts.workspace ?? config.get("workspaceId");

        const spinner = ora({ text: "Fetching audit logs…", color: "blue" }).start();
        try {
          const client = createApiClient();
          const res = await client.get("/dashboard/activity", {
            params: { workspaceId: workspaceId || undefined },
          });
          const logs: any[] = res.data.data ?? [];
          spinner.stop();

          console.log(
            "\n" +
              c.bold(c.accent("  Audit Logs")) +
              c.muted(`  (${logs.length} entries)\n`)
          );
          renderLogsTable(logs);
          console.log("");
        } catch (err: any) {
          spinner.fail("Failed to fetch audit logs.");
          printError(err.response?.data?.message ?? err.message);
          process.exit(1);
        }
      })
  )
  // ── ACTIVITY ──────────────────────────────────────────────────────────────
  .addCommand(
    new Command("activity")
      .description("View recent activity for an issue")
      .argument("<issueId>", "Issue ID (UUID) or key")
      .option("-l, --limit <n>", "Max entries to show", "20")
      .action(async (issueId: string, opts) => {
        requireAuth();
        const spinner = ora({ text: "Fetching issue activity…", color: "blue" }).start();
        try {
          const client = createApiClient();
          const isUuid = issueId.length === 36;
          const issueRes = isUuid
            ? await client.get(`/issues/${issueId}`)
            : await client.get(`/issues/key/${issueId}`);
          const issue = issueRes.data.data;
          const id = issue.id;

          const res = await client.get(`/issues/${id}/audit-logs`, {
            params: { limit: opts.limit },
          });
          const logs: any[] =
            res.data.data?.logs ??
            res.data.data ??
            issue.auditLogs?.slice(0, Number(opts.limit)) ??
            [];

          spinner.stop();
          console.log(
            "\n" +
              c.bold(c.accent(`  Activity — [${issue.key}] `)) +
              c.muted(issue.title?.slice(0, 40)) +
              "\n"
          );
          renderLogsTable(logs);
          console.log("");
        } catch (err: any) {
          spinner.fail("Failed to fetch activity.");
          printError(err.response?.data?.message ?? err.message);
          process.exit(1);
        }
      })
  )
  // ── WEBHOOK ───────────────────────────────────────────────────────────────
  .addCommand(
    new Command("webhook")
      .description("View recent webhook events received")
      .option("-l, --limit <n>", "Max events to show", "20")
      .action(async (opts) => {
        requireAuth();
        const spinner = ora({ text: "Fetching webhook events…", color: "blue" }).start();
        try {
          const client = createApiClient();
          const res = await client.get("/github/webhook-events", {
            params: { limit: opts.limit },
          });
          const logs: any[] = res.data.data?.events ?? res.data.data ?? [];
          spinner.stop();

          console.log(
            "\n" + c.bold(c.accent("  Recent Webhook Events")) + c.muted(`  (${logs.length})\n`)
          );
          renderLogsTable(logs);
          console.log("");
        } catch (err: any) {
          spinner.fail("Failed to fetch webhook events.");
          printError(err.response?.data?.message ?? err.message);
          process.exit(1);
        }
      })
  );
