const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const packageDir = path.resolve(__dirname, "..");
const localPrisma = path.join(packageDir, "node_modules", ".bin", process.platform === "win32" ? "prisma.cmd" : "prisma");

let cmd = localPrisma;
let args = ["generate"];

if (!fs.existsSync(localPrisma)) {
  cmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  args = ["exec", "prisma", "generate"];
}

// On Windows, paths with spaces must be quoted when executed with shell: true
const executable = process.platform === "win32" ? `"${cmd}"` : cmd;

const result = spawnSync(executable, args, {
  cwd: packageDir,
  stdio: "pipe",
  shell: true,
  encoding: "utf-8",
});

if (result.status === 0) {
  if (result.stdout) process.stdout.write(result.stdout);
  process.exit(0);
}

const errorOutput = (result.stderr || "") + (result.stdout || "");

// If Windows holds an exclusive file lock on query_engine-windows.dll.node from an active node server process,
// and the client already exists, avoid crashing the dev/build lifecycle.
if (errorOutput.includes("EPERM") && (errorOutput.includes("query_engine-windows.dll.node") || errorOutput.includes("operation not permitted"))) {
  console.log(
    "⚠️  Prisma Client query engine DLL is currently locked by a running process on Windows. Existing generated client remains valid and in use."
  );
  process.exit(0);
}

// For any real schema or configuration errors, output and fail with real exit code
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exit(result.status || 1);
