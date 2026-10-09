import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";

// Spawn a child as its own process-group leader (detached) so the whole group
// can be killed later via process.kill(-pid). stdout/stderr are tee'd to
// logFile; an "[exit <code>]" line is appended on process exit for post-mortem.
export function spawnApp(opts: {
  app: string;
  args?: string[];
  cwd: string;
  logFile: string;
}): ChildProcess {
  const proc = spawn(process.execPath, [opts.app, ...(opts.args || [])], {
    cwd: opts.cwd,
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true
  });
  const stream = fs.createWriteStream(opts.logFile);
  proc.stdout?.on("data", (d) => stream.write(d));
  proc.stderr?.on("data", (d) => stream.write(d));
  proc.on("close", (code) => stream.end(`\n[exit ${code}]\n`));
  return proc;
}

// Group-kill mirrors the existing harness: detached spawn => each child is a
// PGID leader, so -pid kills the whole group. SIGTERM, 1.5s grace, SIGKILL
// any survivor. Safe to call with null / already-exited procs.
export async function groupKill(proc: ChildProcess | null) {
  if (!proc || proc.exitCode !== null) return;
  try {
    process.kill(-proc.pid!, "SIGTERM");
  } catch {
    try {
      proc.kill("SIGTERM");
    } catch {
      /* noop */
    }
  }
  await new Promise((s) => setTimeout(s, 1500));
  try {
    if (proc.exitCode === null) proc.kill("SIGKILL");
  } catch {
    /* noop */
  }
}
