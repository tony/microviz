import { spawn } from "node:child_process";

const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function spawnPnpm(args, name) {
  const child = spawn(pnpmCommand, args, {
    shell: false,
    stdio: "inherit",
  });

  child.on("error", (err) => {
    console.error(`[dev-loop] ${name} failed to start:`, err);
  });

  return child;
}

const children = [
  spawnPnpm(["--filter", "@microviz/demo", "dev"], "demo"),
  spawnPnpm(["--filter", "@microviz/core", "test:watch"], "core:test:watch"),
];

let shuttingDown = false;

function shutdown(exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }

  process.exit(exitCode ?? 0);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

for (const child of children) {
  child.on("exit", (code) => {
    shutdown(code ?? 0);
  });
}
