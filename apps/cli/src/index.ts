#!/usr/bin/env node
import { program } from "commander";
import { renderBanner } from "./ui/banner.js";
import { issuesCommand } from "./commands/issues.js";
import { prsCommand } from "./commands/prs.js";
import { logsCommand } from "./commands/logs.js";
import { branchCommand } from "./commands/branch.js";
import { authCommand } from "./commands/auth.js";
import { configCommand } from "./commands/config.js";
import { statusCommand } from "./commands/status.js";
import { sprintCommand } from "./commands/sprint.js";

await renderBanner();

program
  .name("devflow")
  .description("🚀 DevFlow CLI — Developer Tooling for the Modern Workflow")
  .version("1.0.0", "-v, --version", "Display the current DevFlow CLI version");

// Register all sub-commands
program.addCommand(authCommand);
program.addCommand(configCommand);
program.addCommand(issuesCommand);
program.addCommand(prsCommand);
program.addCommand(branchCommand);
program.addCommand(logsCommand);
program.addCommand(sprintCommand);
program.addCommand(statusCommand);

// Show help if no sub-command given
if (process.argv.length === 2) {
  program.help();
}

program.parse(process.argv);
