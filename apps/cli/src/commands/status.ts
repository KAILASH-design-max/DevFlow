import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import axios from "axios";
import { config } from "../lib/config.js";
import { c, printSuccess, printError, printWarning, printInfo } from "../ui/banner.js";
import boxen from "boxen";

export const statusCommand = new Command("status")
  .description("Check DevFlow API and service health")
  .action(async () => {
    const apiUrl = config.get("apiUrl");
    const token = config.get("token");
    const email = config.get("email");

    console.log("\n" + c.bold(c.accent("  DevFlow Service Status")) + "\n");

    const spinner = ora({ text: "Checking API health…", color: "blue" }).start();
    const start = Date.now();
    let apiOk = false;
    let apiStatus = 0;
    let latency = 0;
    let errorMsg = "";

    try {
      const res = await axios.get(`${apiUrl}/api/health`, {
        timeout: 5000,
        validateStatus: (s) => s < 500,
      });
      latency = Date.now() - start;
      apiOk = res.status < 400;
      apiStatus = res.status;
      spinner.stop();
    } catch (err: any) {
      latency = Date.now() - start;
      errorMsg = err.code ?? err.message;
      spinner.stop();
    }

    const apiLine = apiOk
      ? `  ${c.success("✔")}  ${c.accent("API Server      ")} ${chalk.gray(`HTTP ${apiStatus}`)}  ${c.muted(`${latency}ms`)}`
      : `  ${c.error("✖")}  ${c.accent("API Server      ")} ${c.error(errorMsg || "unreachable")}`;

    const sessionLine = token && email
      ? `  ${c.success("✔")}  ${c.accent("CLI Session     ")} ${chalk.hex("#52fa7c")(`Authenticated as ${email}`)}`
      : `  ${c.warning("⚠")}  ${c.accent("CLI Session     ")} ${chalk.hex("#ffd93d")("Not logged in (run: devflow auth login)")}`;

    console.log(
      boxen(`${apiLine}\n${sessionLine}`, {
        padding: { top: 1, bottom: 1, left: 1, right: 1 },
        margin: { top: 0, bottom: 1, left: 0, right: 0 },
        borderStyle: "round",
        borderColor: apiOk ? "#52fa7c" : "#ff6b6b",
      })
    );

    if (apiOk) {
      if (!token) {
        printInfo("Tip: Run " + c.accent("devflow auth login") + " or " + c.accent("devflow auth demo") + " to sign in.");
      } else {
        printSuccess("Connected and ready.");
      }
    } else {
      printWarning("API server is unreachable at " + apiUrl);
      printInfo("Ensure backend is running (e.g. pnpm dev)");
    }
    console.log("");
  });
