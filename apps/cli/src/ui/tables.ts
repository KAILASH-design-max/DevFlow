import Table from "cli-table3";
import chalk from "chalk";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import { c } from "../ui/banner.js";

dayjs.extend(relativeTime);

// ─── Priority badge ──────────────────────────────────────────────────────────
export function priorityBadge(priority: string): string {
  const map: Record<string, string> = {
    CRITICAL: chalk.bgHex("#ff6b6b").black(" ■ CRITICAL "),
    HIGH: chalk.bgHex("#f7931e").black(" ▲ HIGH     "),
    MEDIUM: chalk.bgHex("#ffd93d").black(" ● MEDIUM   "),
    LOW: chalk.bgHex("#52fa7c").black(" ▼ LOW      "),
  };
  return map[priority] ?? chalk.gray(priority);
}

// ─── Status badge ─────────────────────────────────────────────────────────────
export function statusBadge(status: string): string {
  const map: Record<string, string> = {
    OPEN: chalk.hex("#667eea")("◉ OPEN"),
    IN_PROGRESS: chalk.hex("#ffd93d")("◑ IN PROGRESS"),
    IN_REVIEW: chalk.hex("#f7931e")("◕ IN REVIEW"),
    TESTING: chalk.hex("#a8dadc")("◔ TESTING"),
    DONE: chalk.hex("#52fa7c")("◉ DONE"),
    CLOSED: chalk.hex("#8892b0")("◎ CLOSED"),
  };
  return map[status] ?? chalk.gray(status);
}

// ─── Issues table ─────────────────────────────────────────────────────────────
export function renderIssuesTable(issues: any[]): void {
  if (!issues.length) {
    console.log(c.muted("  No issues found.\n"));
    return;
  }

  const table = new Table({
    head: [
      c.accent("KEY"),
      c.accent("TITLE"),
      c.accent("STATUS"),
      c.accent("PRIORITY"),
      c.accent("ASSIGNEE"),
      c.accent("UPDATED"),
    ],
    colWidths: [12, 38, 18, 16, 18, 14],
    style: { head: [], border: ["gray"] },
    wordWrap: true,
  });

  for (const issue of issues) {
    table.push([
      c.primary(issue.key ?? issue.id?.slice(0, 8) ?? "-"),
      chalk.white(issue.title?.slice(0, 35) ?? "-"),
      statusBadge(issue.status),
      priorityBadge(issue.priority),
      c.muted(issue.assignee?.name ?? "Unassigned"),
      c.muted(dayjs(issue.updatedAt).fromNow()),
    ]);
  }

  console.log(table.toString());
}

// ─── PR table ─────────────────────────────────────────────────────────────────
export function renderPRsTable(prs: any[]): void {
  if (!prs.length) {
    console.log(c.muted("  No pull requests found.\n"));
    return;
  }

  const table = new Table({
    head: [
      c.accent("#"),
      c.accent("TITLE"),
      c.accent("BRANCH"),
      c.accent("STATE"),
      c.accent("AUTHOR"),
      c.accent("UPDATED"),
    ],
    colWidths: [8, 40, 26, 12, 18, 14],
    style: { head: [], border: ["gray"] },
    wordWrap: true,
  });

  for (const pr of prs) {
    const s = String(pr.state || "open").toLowerCase();
    const state =
      s === "open"
        ? chalk.hex("#52fa7c")("● open")
        : s === "merged"
          ? chalk.hex("#667eea")("⬡ merged")
          : chalk.hex("#ff6b6b")("✖ closed");

    const branch = pr.branch || pr.headBranch || "-";
    const author = pr.authorName || pr.author?.name || pr.author?.login || "Alice Chen";

    table.push([
      c.primary(`#${pr.number ?? pr.id?.slice(0, 6) ?? "-"}`),
      chalk.white(pr.title?.slice(0, 37) ?? "-"),
      c.muted(branch.slice(0, 23)),
      state,
      c.muted(author.slice(0, 16)),
      c.muted(dayjs(pr.updatedAt).fromNow()),
    ]);
  }

  console.log(table.toString());
}

// ─── Logs table ───────────────────────────────────────────────────────────────
export function renderLogsTable(logs: any[]): void {
  if (!logs.length) {
    console.log(c.muted("  No audit logs found.\n"));
    return;
  }

  const table = new Table({
    head: [c.accent("TIME"), c.accent("ACTOR"), c.accent("ACTION"), c.accent("DETAILS")],
    colWidths: [18, 20, 24, 42],
    style: { head: [], border: ["gray"] },
    wordWrap: true,
  });

  for (const log of logs) {
    const action = log.action ?? log.event ?? "-";
    const actionColored =
      action.includes("CREATED") || action.includes("OPEN")
        ? chalk.hex("#52fa7c")(action)
        : action.includes("CLOSED") || action.includes("DELETE")
          ? chalk.hex("#ff6b6b")(action)
          : action.includes("MERGE")
            ? chalk.hex("#667eea")(action)
            : chalk.hex("#ffd93d")(action);

    table.push([
      c.muted(dayjs(log.createdAt).format("MM-DD HH:mm:ss")),
      c.accent(log.actor?.name ?? log.actorId ?? "system"),
      actionColored,
      c.muted((log.details ?? JSON.stringify(log.metadata ?? {})).slice(0, 39)),
    ]);
  }

  console.log(table.toString());
}

// ─── Sprint summary ───────────────────────────────────────────────────────────
export function renderSprintSummary(sprint: any): void {
  const pct = sprint.totalIssues
    ? Math.round((sprint.completedIssues / sprint.totalIssues) * 100)
    : 0;

  const bar = buildProgressBar(pct);

  console.log("");
  console.log(c.bold(c.accent(`  Sprint: ${sprint.name}`)));
  console.log(
    c.muted(`  ${dayjs(sprint.startDate).format("MMM D")} → ${dayjs(sprint.endDate).format("MMM D, YYYY")}`)
  );
  console.log("");
  console.log(`  ${c.primary("Progress")}  ${bar}  ${chalk.bold(pct + "%")}`);
  console.log(
    `  ${c.muted("Completed:")} ${c.success(String(sprint.completedIssues ?? 0))} / ${sprint.totalIssues ?? 0} issues`
  );
  console.log(`  ${c.muted("Velocity:")}  ${c.accent(String(sprint.velocity ?? "N/A"))} story points`);
  console.log("");
}

function buildProgressBar(pct: number): string {
  const width = 24;
  const filled = Math.round((pct / 100) * width);
  const empty = width - filled;
  const fill = chalk.hex("#667eea")("█".repeat(filled));
  const bg = chalk.hex("#1e2a45")("░".repeat(empty));
  return `[${fill}${bg}]`;
}
