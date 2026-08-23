import { Command } from "commander";
import inquirer from "inquirer";
import ora from "ora";
import chalk from "chalk";
import { config, createApiClient, requireAuth } from "../lib/config.js";
import { c, printSuccess, printError, printInfo, printDim } from "../ui/banner.js";
import { renderIssuesTable, priorityBadge, statusBadge } from "../ui/tables.js";
import boxen from "boxen";
import dayjs from "dayjs";

export const issuesCommand = new Command("issues")
  .alias("issue")
  .description("Manage DevFlow issues")
  // ── LIST ─────────────────────────────────────────────────────────────────
  .addCommand(
    new Command("list")
      .description("List issues for a project")
      .option("-p, --project <id>", "Project ID (overrides default)")
      .option("-s, --status <status>", "Filter by status (OPEN, IN_PROGRESS, DONE…)")
      .option("-P, --priority <priority>", "Filter by priority (CRITICAL, HIGH, MEDIUM, LOW)")
      .option("-a, --assignee <userId>", "Filter by assignee user ID")
      .option("-l, --limit <n>", "Max issues to show", "20")
      .action(async (opts) => {
        requireAuth();
        const projectId = opts.project ?? config.get("projectId");
        if (!projectId) {
          printError("No project set. Use --project <id> or run: devflow config set-project <id>");
          process.exit(1);
        }

        const spinner = ora({ text: "Fetching issues…", color: "blue" }).start();
        try {
          const client = createApiClient();
          const params: Record<string, string> = {
            projectId,
            limit: opts.limit,
            ...(opts.status ? { status: opts.status } : {}),
            ...(opts.priority ? { priority: opts.priority } : {}),
            ...(opts.assignee ? { assigneeId: opts.assignee } : {}),
          };
          const res = await client.get("/issues", { params });
          const issues: any[] = res.data.data?.issues ?? res.data.data ?? [];
          spinner.stop();

          console.log(
            "\n" +
              c.bold(c.accent(`  Issues — Project: ${projectId.slice(0, 8)}…`)) +
              c.muted(`  (${issues.length} results)\n`)
          );
          renderIssuesTable(issues);
          printDim(`\n  Run ${c.accent("devflow issues view <key>")} to see full details.\n`);
        } catch (err: any) {
          spinner.fail("Failed to fetch issues.");
          printError(err.response?.data?.message ?? err.message);
          process.exit(1);
        }
      })
  )
  // ── VIEW ──────────────────────────────────────────────────────────────────
  .addCommand(
    new Command("view")
      .description("View issue details by key or ID")
      .argument("<key>", "Issue key (e.g. PHX-42) or UUID")
      .action(async (key: string) => {
        requireAuth();
        const spinner = ora({ text: "Loading issue…", color: "blue" }).start();
        try {
          const client = createApiClient();
          let issue: any = null;
          try {
            const res = await client.get(`/issues/${key}`);
            issue = res.data.data;
          } catch (_) {
            const projectId = config.get("projectId");
            if (projectId) {
              const searchRes = await client.get(`/issues`, { params: { projectId } });
              const list = searchRes.data.data ?? [];
              issue = list.find((i: any) => i.id === key || i.id?.startsWith(key) || String(i.number) === key || i.key === key);
            }
          }

          if (!issue) {
            throw new Error(`Issue "${key}" not found.`);
          }
          spinner.stop();

          console.log(
            "\n" +
              boxen(
                c.bold(c.accent(`[${issue.key ?? issue.id?.slice(0, 8)}] `)) +
                  chalk.white(issue.title) +
                  "\n\n" +
                  `  ${c.muted("Status:")}    ${statusBadge(issue.status)}\n` +
                  `  ${c.muted("Priority:")}  ${priorityBadge(issue.priority)}\n` +
                  `  ${c.muted("Assignee:")}  ${c.accent(issue.assignee?.name ?? "Unassigned")}\n` +
                  `  ${c.muted("Reporter:")}  ${c.muted(issue.reporter?.name ?? "-")}\n` +
                  `  ${c.muted("Created:")}   ${c.muted(dayjs(issue.createdAt).format("MMM D, YYYY HH:mm"))}\n` +
                  `  ${c.muted("Updated:")}   ${c.muted(dayjs(issue.updatedAt).format("MMM D, YYYY HH:mm"))}\n` +
                  (issue.description
                    ? `\n  ${c.muted("Description:")}\n  ${chalk.white(issue.description.slice(0, 200))}${issue.description.length > 200 ? "…" : ""}`
                    : ""),
                {
                  padding: { top: 1, bottom: 1, left: 2, right: 2 },
                  margin: { top: 0, bottom: 1, left: 0, right: 0 },
                  borderStyle: "round",
                  borderColor: "#667eea",
                }
              )
          );

          if (issue.labels?.length) {
            printInfo(`Labels: ${issue.labels.map((l: any) => l.name).join(", ")}`);
          }
          if (issue.comments?.length) {
            printInfo(`Comments: ${issue.comments.length}`);
          }
          console.log("");
        } catch (err: any) {
          spinner.fail("Issue not found.");
          printError(err.response?.data?.message ?? err.message);
          process.exit(1);
        }
      })
  )
  // ── CREATE ────────────────────────────────────────────────────────────────
  .addCommand(
    new Command("create")
      .description("Create a new issue interactively")
      .option("-p, --project <id>", "Project ID (overrides default)")
      .action(async (opts) => {
        requireAuth();
        const projectId = opts.project ?? config.get("projectId");
        if (!projectId) {
          printError("No project set. Use --project <id> or run: devflow config set-project <id>");
          process.exit(1);
        }

        console.log("\n" + c.bold(c.accent("  Create New Issue")) + "\n");

        const answers = await inquirer.prompt([
          {
            type: "input",
            name: "title",
            message: c.primary("Title:"),
            validate: (v: string) => v.trim().length >= 5 ? true : "Title must be at least 5 characters",
          },
          {
            type: "editor",
            name: "description",
            message: c.primary("Description (opens editor):"),
          },
          {
            type: "list",
            name: "priority",
            message: c.primary("Priority:"),
            choices: [
              { name: "🔴  CRITICAL", value: "CRITICAL" },
              { name: "🟠  HIGH", value: "HIGH" },
              { name: "🟡  MEDIUM", value: "MEDIUM" },
              { name: "🟢  LOW", value: "LOW" },
            ],
            default: "MEDIUM",
          },
          {
            type: "list",
            name: "type",
            message: c.primary("Issue type:"),
            choices: [
              { name: "🐛  Bug", value: "BUG" },
              { name: "✨  Feature", value: "FEATURE" },
              { name: "🔧  Task", value: "TASK" },
              { name: "📄  Story", value: "STORY" },
              { name: "⚡  Improvement", value: "IMPROVEMENT" },
            ],
            default: "BUG",
          },
        ]);

        const spinner = ora({ text: "Creating issue…", color: "blue" }).start();
        try {
          const client = createApiClient();
          const res = await client.post("/issues", {
            ...answers,
            projectId,
          });
          const created = res.data.data;
          spinner.succeed(c.success("Issue created successfully!"));

          console.log(
            "\n" +
              boxen(
                c.bold(c.accent(`[${created.key}] `)) + chalk.white(created.title) + "\n" +
                  c.muted(`  Status: `) + statusBadge(created.status) + "  " +
                  priorityBadge(created.priority),
                {
                  padding: { top: 0, bottom: 0, left: 2, right: 2 },
                  margin: { top: 0, bottom: 1, left: 0, right: 0 },
                  borderStyle: "round",
                  borderColor: "#52fa7c",
                }
              )
          );

          printDim(`  Run ${c.accent(`devflow branch suggest ${created.key}`)} to get the branch name.\n`);
        } catch (err: any) {
          spinner.fail("Failed to create issue.");
          printError(err.response?.data?.message ?? err.message);
          process.exit(1);
        }
      })
  )
  // ── UPDATE STATUS ─────────────────────────────────────────────────────────
  .addCommand(
    new Command("move")
      .description("Move an issue to a different status")
      .argument("<key>", "Issue key or ID")
      .argument("<status>", "Target status: OPEN | IN_PROGRESS | IN_REVIEW | TESTING | DONE | CLOSED")
      .action(async (key: string, status: string) => {
        requireAuth();
        const spinner = ora({ text: `Moving issue ${key} to ${status}…`, color: "blue" }).start();
        try {
          const client = createApiClient();
          const isUuid = key.length === 36;
          const issueRes = isUuid
            ? await client.get(`/issues/${key}`)
            : await client.get(`/issues/key/${key}`);
          const issueId = issueRes.data.data.id;
          await client.patch(`/issues/${issueId}`, { status: status.toUpperCase() });
          spinner.succeed(c.success(`Issue ${key} moved to ${status.toUpperCase()}`));
        } catch (err: any) {
          spinner.fail("Failed to move issue.");
          printError(err.response?.data?.message ?? err.message);
          process.exit(1);
        }
      })
  );
