import { Command } from "commander";
import { config } from "../lib/config.js";
import { c, printSuccess, printError, printInfo } from "../ui/banner.js";
import boxen from "boxen";

export const configCommand = new Command("config")
  .description("Manage DevFlow CLI configuration")
  .addCommand(
    new Command("set-url")
      .description("Set the DevFlow API base URL")
      .argument("<url>", "API base URL (e.g. http://localhost:4000)")
      .action((url: string) => {
        if (!url.startsWith("http")) {
          printError("URL must start with http:// or https://");
          process.exit(1);
        }
        config.set("apiUrl", url.replace(/\/$/, ""));
        printSuccess(`API URL set to: ${url}`);
      })
  )
  .addCommand(
    new Command("set-project")
      .description("Set default project ID for CLI commands")
      .argument("<projectId>", "Project ID (UUID)")
      .action((projectId: string) => {
        config.set("projectId", projectId);
        printSuccess(`Default project set to: ${projectId}`);
      })
  )
  .addCommand(
    new Command("set-workspace")
      .description("Set default workspace ID for CLI commands")
      .argument("<workspaceId>", "Workspace ID (UUID)")
      .action((workspaceId: string) => {
        config.set("workspaceId", workspaceId);
        printSuccess(`Default workspace set to: ${workspaceId}`);
      })
  )
  .addCommand(
    new Command("show")
      .description("Display current CLI configuration")
      .action(() => {
        const cfg = config.getAll();
        console.log("\n" + c.bold(c.accent("  DevFlow CLI Configuration")) + "\n");
        printInfo(`API URL:      ${cfg.apiUrl}`);
        printInfo(`Email:        ${cfg.email ?? "(not set)"}`);
        printInfo(`Project ID:   ${cfg.projectId ?? "(not set)"}`);
        printInfo(`Workspace ID: ${cfg.workspaceId ?? "(not set)"}`);
        printInfo(`Config file:  ${config.configPath}`);
        console.log(
          "\n" +
            c.muted("  Tip: Run ") +
            c.accent("devflow auth login") +
            c.muted(" to authenticate.\n")
        );
      })
  )
  .addCommand(
    new Command("reset")
      .description("Reset all CLI configuration")
      .action(() => {
        config.clear();
        printSuccess("Configuration reset to defaults.");
      })
  );
