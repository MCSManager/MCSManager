import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { ChildProcess } from "node:child_process";
import { describe, expect, it, vi } from "vitest";
import {
  PortConflictError,
  retryOnPortConflict,
  waitForChildReady
} from "../../test/integration/lib/startup";

describe("integration startup", () => {
  it("retries bind conflicts but does not retry unrelated failures", async () => {
    const attempt = vi
      .fn()
      .mockRejectedValueOnce(new PortConflictError("occupied"))
      .mockResolvedValueOnce("ready");
    expect(await retryOnPortConflict(attempt)).toBe("ready");
    expect(attempt).toHaveBeenCalledTimes(2);
    const failed = vi.fn().mockRejectedValue(new Error("bad config"));
    await expect(retryOnPortConflict(failed)).rejects.toThrow("bad config");
    expect(failed).toHaveBeenCalledTimes(1);
  });

  it("limits bind retries to three attempts", async () => {
    const attempt = vi.fn().mockRejectedValue(new PortConflictError("occupied"));
    await expect(retryOnPortConflict(attempt)).rejects.toThrow(PortConflictError);
    expect(attempt).toHaveBeenCalledTimes(3);
  });

  it("detects a child bind failure before probing someone else's listener", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mcsm-startup-test-"));
    const logFile = path.join(dir, "child.log");
    fs.writeFileSync(logFile, "listen EADDRINUSE: address already in use");
    const ready = vi.fn().mockResolvedValue(true);
    try {
      await expect(
        waitForChildReady(
          ready,
          [
            {
              process: { exitCode: 1, signalCode: null } as ChildProcess,
              logFile
            }
          ],
          500,
          "test ready"
        )
      ).rejects.toThrow(PortConflictError);
      expect(ready).not.toHaveBeenCalled();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("reports a failed child rather than waiting for an HTTP timeout", async () => {
    await expect(
      waitForChildReady(
        async () => false,
        [
          {
            process: { exitCode: 1, signalCode: null } as ChildProcess,
            logFile: path.join(os.tmpdir(), "nonexistent-mcsm-startup.log")
          }
        ],
        500,
        "test ready"
      )
    ).rejects.toThrow("Test process exited");
  });
});
