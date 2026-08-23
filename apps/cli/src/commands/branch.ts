import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import { config, createApiClient, requireAuth } from "../lib/config.js";
import { c, printError, printInfo, printDim } from "../ui/banner.js";
import boxen from "boxen";

// Branch prefix map matching the backend GitHub service
const TYPE_PREFIXES: Record<string, string> = {
  BUG: "fix",
  FEATURE: "feat",
  TASK: "task",
  STORY: "story",
  IMPROVEMENT: "improve",
  CHORE: "chore",
  HOTFIX: "hotfix",
  EPIC: "epic",
  SUBTASK: "task",
};

function buildBranchName(issue: {
  key: string;
  title: string;
  type?: string;
}): string {
  const prefix = TYPE_PREFIXES[issue.type ?? "TASK"] ?? "task";
  const slug = issue.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40)
    .replace(/-+$/, "");
  const key = issue.key.toLowerCase().replace("/", "-");
  return `${prefix}/${key}-${slug}`;
}

export const branchCommand = new Command("branch")
  .description("Branch name helper for DevFlow issues")
  // ── SUGGEST ───────────────────────────────────────────────────────────────
  .addCommand(
    new Command("suggest")
      .description("Get the recommended branch name for an issue")
      .argument("<key>", "Issue key (e.g. PHX-42) or UUID")
      .option("--copy", "Copy the branch name to clipboard (if supported)")
      .action(async (key: string, opts) => {
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

          const issueKey = issue.key || (issue.project?.key ? `${issue.project.key}-${issue.number}` : `ISSUE-${issue.number || issue.id.slice(0,6)}`);
          const branch = buildBranchName({ ...issue, key: issueKey });

          console.log(
            "\n" +
              boxen(
                c.bold(c.accent(`  Branch for [${issue.key}]`)) + "\n\n" +
                  `  ${c.muted("Issue:")}   ${chalk.white(issue.title.slice(0, 50))}\n` +
                  `  ${c.muted("Type:")}    ${c.primary(issue.type ?? "TASK")}\n\n` +
                  `  ${c.muted("Branch:")}  ${c.success(branch)}\n\n` +
                  c.muted("  ─────────────────────────────────────────────────\n") +
                  `  ${c.muted("Checkout command:")}\n` +
                  `  ${chalk.hex("#adc6ff")(`git checkout -b ${branch}`)}`,
                {
                  padding: { top: 1, bottom: 1, left: 2, right: 2 },
                  margin: { top: 0, bottom: 1, left: 0, right: 0 },
                  borderStyle: "round",
                  borderColor: "#52fa7c",
                }
              )
          );

          printDim(
            `  Tip: ${c.accent("git checkout -b " + branch)}\n` +
              `       ${c.accent("git push -u origin " + branch)}\n`
          );
        } catch (err: any) {
          spinner.fail("Issue not found.");
          printError(err.response?.data?.message ?? err.message);
          process.exit(1);
        }
      })
  )
  // ── LIST NAMING CONVENTIONS ───────────────────────────────────────────────
  .addCommand(
    new Command("conventions")
      .description("Show branch naming conventions")
      .action(() => {
        console.log("\n" + c.bold(c.accent("  DevFlow Branch Conventions")) + "\n");
        console.log(
          boxen(
            Object.entries(TYPE_PREFIXES)
              .map(
                ([type, prefix]) =>
                  `  ${c.primary(type.padEnd(14))} → ${c.success(prefix + "/<KEY>-<slug>")}`
              )
              .join("\n") +
              "\n\n" +
              c.muted("  Example:  ") +
              chalk.white("fix/phx-42-checkout-coupon-bug"),
            {
              padding: { top: 1, bottom: 1, left: 1, right: 1 },
              borderStyle: "round",
              borderColor: "#667eea",
            }
          )
        );
        console.log("");
      })
  );
