import { Command } from "commander";
import inquirer from "inquirer";
import ora from "ora";
import chalk from "chalk";
import { config, createApiClient } from "../lib/config.js";
import { c, printSuccess, printError, printInfo } from "../ui/banner.js";
import boxen from "boxen";

export const authCommand = new Command("auth")
  .description("Authenticate with DevFlow API")
  .addCommand(
    new Command("login")
      .description("Sign in to your DevFlow account")
      .option("-e, --email <email>", "User email")
      .option("-p, --password <password>", "User password")
      .action(async (opts) => {
        console.log("\n" + c.bold(c.accent("  DevFlow Login")) + "\n");

        let email = opts.email;
        let password = opts.password;

        if (!email || !password) {
          const questions: any[] = [];
          if (!email) {
            questions.push({
              type: "input",
              name: "email",
              message: c.primary("Email:"),
              default: "alice@devflow.io",
              validate: (v: string) =>
                v.includes("@") ? true : "Please enter a valid email",
            });
          }
          if (!password) {
            questions.push({
              type: "password",
              name: "password",
              message: c.primary("Password (default: Password123):"),
              mask: "•",
              default: "Password123",
            });
          }
          const answers = await inquirer.prompt(questions);
          email = email || answers.email;
          password = password || answers.password;
        }

        const spinner = ora({
          text: "Authenticating...",
          color: "blue",
          spinner: "dots",
        }).start();

        try {
          const apiUrl = config.get("apiUrl");
          const client = createApiClient();
          const res = await client.post("/auth/login", { email, password });

          const raw = res.data.data ?? res.data;
          const token = raw.token || raw.tokens?.accessToken || raw.accessToken;
          const user = raw.user || raw;

          config.set("token", token);
          config.set("userId", user.id);
          config.set("email", user.email);

          // Auto-discover workspace & project
          try {
            const wsRes = await client.get("/workspaces", {
              headers: { Authorization: `Bearer ${token}` },
            });
            const workspaces = wsRes.data.data?.workspaces ?? wsRes.data.data ?? [];
            if (workspaces.length > 0) {
              const wsId = workspaces[0].id;
              config.set("workspaceId", wsId);
              const projRes = await client.get("/projects", {
                params: { workspaceId: wsId },
                headers: { Authorization: `Bearer ${token}` },
              });
              const projList = projRes.data.data?.projects ?? projRes.data.data ?? [];
              if (projList.length > 0) {
                config.set("projectId", projList[0].id);
              }
            }
          } catch (e) {
            // Ignore if workspaces route has different shape
          }

          spinner.succeed(chalk.hex("#52fa7c")("Authenticated successfully!"));

          const projId = config.get("projectId");
          console.log(
            "\n" +
              boxen(
                c.success("✔ Logged in as ") +
                  c.bold(c.accent(user.name ?? user.email)) +
                  "\n" +
                  c.muted(`  API:       ${apiUrl}`) +
                  "\n" +
                  (projId ? c.muted(`  Project:   ${projId}`) + "\n" : "") +
                  c.accent("  Ready! Try running: devflow pr list or devflow issue list"),
                {
                  padding: { top: 0, bottom: 0, left: 2, right: 2 },
                  borderStyle: "round",
                  borderColor: "#52fa7c",
                }
              ) +
              "\n"
          );
        } catch (err: any) {
          spinner.fail(chalk.hex("#ff6b6b")("Authentication failed."));
          printError(
            err.response?.data?.message ?? err.message ?? "Unknown error"
          );
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command("demo")
      .description("Instant 1-click login with default demo account")
      .action(async () => {
        const spinner = ora({ text: "Logging in with demo account…", color: "blue" }).start();
        try {
          const client = createApiClient();
          const res = await client.post("/auth/login", {
            email: "alice@devflow.io",
            password: "Password123",
          });
          const raw = res.data.data ?? res.data;
          const token = raw.token || raw.tokens?.accessToken || raw.accessToken;
          const user = raw.user || raw;

          config.set("token", token);
          config.set("userId", user.id);
          config.set("email", user.email);

          // Find projects
          try {
            const wsRes = await client.get("/workspaces", {
              headers: { Authorization: `Bearer ${token}` },
            });
            const wsList = wsRes.data.data?.workspaces ?? wsRes.data.data ?? [];
            if (wsList.length > 0) {
              const wsId = wsList[0].id;
              config.set("workspaceId", wsId);
              const projRes = await client.get("/projects", {
                params: { workspaceId: wsId },
                headers: { Authorization: `Bearer ${token}` },
              });
              const projList = projRes.data.data?.projects ?? projRes.data.data ?? [];
              if (projList.length > 0) {
                config.set("projectId", projList[0].id);
              }
            }
          } catch (_) {}

          spinner.succeed(c.success(`Logged in as demo user: ${user.name} (${user.email})`));
          const proj = config.get("projectId");
          if (proj) printInfo(`Default Project set to: ${proj}`);
        } catch (err: any) {
          spinner.fail("Demo login failed.");
          printError(err.response?.data?.message ?? err.message);
        }
      })
  )
  .addCommand(
    new Command("logout")
      .description("Sign out from DevFlow")
      .action(() => {
        config.clear();
        printSuccess("Logged out successfully.");
      })
  )
  .addCommand(
    new Command("whoami")
      .description("Display current authenticated user")
      .action(() => {
        const email = config.get("email");
        const token = config.get("token");
        if (!token || !email) {
          printError("Not logged in. Run: devflow auth login");
          process.exit(1);
        }
        console.log("\n" + c.bold("  Current User") + "\n");
        printInfo(`Email:        ${email}`);
        printInfo(`API:          ${config.get("apiUrl")}`);
        printInfo(`Project ID:   ${config.get("projectId") ?? "(auto)"}`);
        printInfo(`Workspace ID: ${config.get("workspaceId") ?? "(auto)"}`);
        printInfo(`Token:        ${token.slice(0, 20)}...`);
        console.log("");
      })
  );
