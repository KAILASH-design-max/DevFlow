import chalk from "chalk";
import figlet from "figlet";
import gradient from "gradient-string";
import boxen from "boxen";

export async function renderBanner(): Promise<void> {
  // Only render banner on direct invocation (not sub-command pipe)
  if (process.argv.length > 2) return;

  const art = figlet.textSync("DevFlow", {
    font: "ANSI Shadow",
    horizontalLayout: "full",
  });

  const colored = gradient(["#667eea", "#764ba2", "#f093fb"])(art);
  console.log(colored);

  console.log(
    boxen(
      chalk.hex("#adc6ff").bold(" 🚀 DevFlow CLI  ") +
        chalk.hex("#667eea")("v1.0.0") +
        "\n" +
        chalk.hex("#8892b0")(
          " Developer tooling for issues, PRs, branches, and logs"
        ),
      {
        padding: { top: 0, bottom: 0, left: 2, right: 2 },
        margin: { top: 0, bottom: 1, left: 0, right: 0 },
        borderStyle: "round",
        borderColor: "#667eea",
        dimBorder: false,
      }
    )
  );
}

export function printSuccess(msg: string): void {
  console.log(chalk.hex("#52fa7c")("✔ ") + chalk.white(msg));
}

export function printError(msg: string): void {
  console.error(chalk.hex("#ff6b6b")("✖ ") + chalk.white(msg));
}

export function printWarning(msg: string): void {
  console.warn(chalk.hex("#ffd93d")("⚠ ") + chalk.white(msg));
}

export function printInfo(msg: string): void {
  console.log(chalk.hex("#667eea")("ℹ ") + chalk.white(msg));
}

export function printDim(msg: string): void {
  console.log(chalk.hex("#8892b0")(msg));
}

export const c = {
  primary: (s: string) => chalk.hex("#667eea")(s),
  accent: (s: string) => chalk.hex("#adc6ff")(s),
  muted: (s: string) => chalk.hex("#8892b0")(s),
  success: (s: string) => chalk.hex("#52fa7c")(s),
  error: (s: string) => chalk.hex("#ff6b6b")(s),
  warning: (s: string) => chalk.hex("#ffd93d")(s),
  white: (s: string) => chalk.white(s),
  bold: (s: string) => chalk.bold(s),
};
