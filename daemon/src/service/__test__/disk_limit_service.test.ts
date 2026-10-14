import { exec } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import { promisify } from "util";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeInstance } from "../../../test/harness/mocks";
import logger from "../log";

vi.mock("node:child_process", async () => {
  const { promisify } = await vi.importActual<typeof import("util")>("util");
  const exec = vi.fn();
  Object.defineProperty(exec, promisify.custom, { value: vi.fn() });
  return { exec };
});
vi.mock("../../entity/instance/instance", () => ({
  default: { STATUS_RUNNING: 1, STATUS_STOP: 0 }
}));
vi.mock("../../i18n", () => ({ $t: (key: string) => key }));
vi.mock("../log", () => ({ default: { warn: vi.fn() } }));

const execPromise = vi.mocked(promisify(exec));
const MB = 1024 * 1024;
let service: typeof import("../disk_limit_service").default;

function instance(uuid: string, info = {}) {
  return fakeInstance(uuid, {
    config: { docker: { maxSpace: 1 } },
    info,
    isGlobalInstance: () => false,
    status: vi.fn(() => 1),
    println: vi.fn()
  });
}

function deferredScan() {
  let resolve!: (value: { stdout: string; stderr: string }) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<{ stdout: string; stderr: string }>((ok, fail) => {
    resolve = ok;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function vanishedFileError() {
  return Object.assign(
    new Error("du: cannot access '/tmp/inst-failed/pending/item': No such file or directory"),
    {
      code: 1,
      stdout: "776801\t/tmp/inst-failed\n",
      stderr: "du: cannot access '/tmp/inst-failed/pending/item': No such file or directory\n"
    }
  );
}

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  execPromise.mockReset();
  vi.mocked(logger.warn).mockClear();
  vi.spyOn(os, "platform").mockReturnValue("linux");
  vi.spyOn(fs, "existsSync").mockReturnValue(true);
  service = (await import("../disk_limit_service")).default;
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("DiskLimitService scan failures", () => {
  it.each([false, true])(
    "preserves direct scan errors and the last measurement (autoStop=%s)",
    async (autoStop) => {
      const target = instance("failed", { storageUsage: 64 * MB, storageLimit: 1024 * MB });
      const error = vanishedFileError();
      execPromise.mockRejectedValueOnce(error);

      await expect(
        service.checkDiskNow(
          { instance: target, workspace: target.absoluteCwdPath(), maxSpace: 1 },
          autoStop
        )
      ).rejects.toBe(error);

      expect(target.info).toEqual({ storageUsage: 64 * MB, storageLimit: 1024 * MB });
      expect(target.execPreset).not.toHaveBeenCalled();
      expect(target.println).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
    }
  );

  it("waits for the whole batch after a failed scan and allows a later retry", async () => {
    const warmup = deferredScan();
    const failedScan = deferredScan();
    const slowScan = deferredScan();
    execPromise
      .mockReturnValueOnce(warmup.promise as any)
      .mockReturnValueOnce(failedScan.promise as any)
      .mockReturnValueOnce(slowScan.promise as any)
      .mockResolvedValue({ stdout: "96\t/tmp/instance\n", stderr: "" } as any);
    const failed = instance("failed");
    const slow = instance("slow");
    const queued = instance("queued");

    await service.checkInstanceDiskSize(instance("warmup"));
    await service.checkInstanceDiskSize(failed);
    await service.checkInstanceDiskSize(slow);
    expect(execPromise).toHaveBeenCalledTimes(1);
    warmup.resolve({ stdout: "32\t/tmp/inst-warmup\n", stderr: "" });
    await vi.advanceTimersByTimeAsync(10000);
    expect(execPromise).toHaveBeenCalledTimes(3);

    const error = vanishedFileError();
    failedScan.reject(error);
    await vi.advanceTimersByTimeAsync(0);
    await service.checkInstanceDiskSize(queued);
    await vi.advanceTimersByTimeAsync(10000);
    expect(execPromise).toHaveBeenCalledTimes(3);
    expect(failed.info).toEqual({});
    expect(failed.execPreset).not.toHaveBeenCalled();
    expect(failed.println).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("failed"), error);
    expect(logger.warn).toHaveBeenCalledTimes(1);

    slowScan.resolve({ stdout: "48\t/tmp/inst-slow\n", stderr: "" });
    await vi.advanceTimersByTimeAsync(0);
    expect(slow.info).toEqual({ storageUsage: 48 * MB, storageLimit: 1024 * MB });
    await service.checkInstanceDiskSize(failed);
    await vi.advanceTimersByTimeAsync(0);
    expect(execPromise).toHaveBeenCalledTimes(5);
    expect(queued.info).toEqual({ storageUsage: 96 * MB, storageLimit: 1024 * MB });
    expect(failed.info).toEqual({ storageUsage: 96 * MB, storageLimit: 1024 * MB });
    expect(queued.execPreset).not.toHaveBeenCalled();
    expect(failed.execPreset).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });
});
