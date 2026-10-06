import fs from "node:fs";
import type { ChildProcess } from "node:child_process";

export class PortConflictError extends Error {}

export async function retryOnPortConflict<T>(attempt: () => Promise<T>): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await attempt();
    } catch (error) {
      if (!(error instanceof PortConflictError) || i >= 2) throw error;
    }
  }
}

export async function waitForChildReady(
  ready: () => Promise<boolean>,
  children: { process: ChildProcess; logFile: string }[],
  timeout: number,
  label: string
) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const child of children) {
      if (child.process.exitCode === null && child.process.signalCode === null) continue;
      const log = fs.existsSync(child.logFile) ? fs.readFileSync(child.logFile, "utf8") : "";
      if (log.includes("EADDRINUSE")) throw new PortConflictError("Test port already in use");
      throw new Error(`Test process exited before ${label}; see ${child.logFile}`);
    }
    try {
      if (await ready()) return;
    } catch {
      // HTTP/socket probes can fail transiently while the child starts.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${label}`);
}
