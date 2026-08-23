import { Command } from "commander";
import ora from "ora";
import { config, createApiClient, requireAuth } from "../lib/config.js";
import { c, printError, printInfo } from "../ui/banner.js";
import { renderIssuesTable, renderSprintSummary } from "../ui/tables.js";

export const sprintCommand = new Command("sprint")
  .description("View and manage sprints")
  // ── CURRENT ───────────────────────────────────────────────────────────────
  .addCommand(
    new Command("current")
      .description("View the active sprint and its issues")
      .option("-p, --project <id>", "Project ID (overrides default)")
      .action(async (opts) => {
        requireAuth();
        const projectId = opts.project ?? config.get("projectId");
        if (!projectId) {
          printError("No project set. Use --project <id> or run: devflow config set-project <id>");
          process.exit(1);
        }

        const spinner = ora({ text: "Loading sprint…", color: "blue" }).start();
        try {
          const client = createApiClient();
          const res = await client.get("/sprints", { params: { projectId } });
          const sprints: any[] = res.data.data?.sprints ?? res.data.data ?? [];
          spinner.stop();

          const sprint = sprints.find((s) => s.status === "ACTIVE") || sprints[0];

          if (!sprint) {
            printInfo("No sprints found for this project.");
            return;
          }

          renderSprintSummary(sprint);

          if (sprint.issues?.length) {
            console.log(c.bold(c.accent("  Sprint Issues\n")));
            renderIssuesTable(sprint.issues);
          }
          console.log("");
        } catch (err: any) {
          spinner.fail("Failed to load sprint.");
          printError(err.response?.data?.message ?? err.message);
          process.exit(1);
        }
      })
  )
  // ── LIST ──────────────────────────────────────────────────────────────────
  .addCommand(
    new Command("list")
      .description("List all sprints for a project")
      .option("-p, --project <id>", "Project ID")
      .action(async (opts) => {
        requireAuth();
        const projectId = opts.project ?? config.get("projectId");
        if (!projectId) {
          printError("No project set. Use --project <id> or run: devflow config set-project <id>");
          process.exit(1);
        }

        const spinner = ora({ text: "Loading sprints…", color: "blue" }).start();
        try {
          const client = createApiClient();
          const res = await client.get("/sprints", { params: { projectId } });
          const sprints: any[] = res.data.data?.sprints ?? res.data.data ?? [];
          spinner.stop();

          if (!sprints.length) {
            printInfo("No sprints found.");
            return;
          }

          console.log("\n" + c.bold(c.accent(`  Sprints — ${sprints.length} total`)) + "\n");
          for (const s of sprints) {
            renderSprintSummary(s);
          }
        } catch (err: any) {
          spinner.fail("Failed to list sprints.");
          printError(err.response?.data?.message ?? err.message);
          process.exit(1);
        }
      })
  );
