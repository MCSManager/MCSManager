import { beforeEach, describe, expect, it } from "vitest";
import { globalConfiguration, globalEnv } from "../entity/config";
import { acquireFileTask, validateFileTransferTargets } from "./file_task";

beforeEach(() => {
  globalConfiguration.config.maxFileTask = 2;
  globalConfiguration.config.maxGlobalFileTask = 3;
  globalEnv.fileTaskCount = 0;
});

describe("file transfer batches", () => {
  it("accepts bounded path pairs", () => {
    expect(() => validateFileTransferTargets([["source", "destination"]])).not.toThrow();
    expect(() =>
      validateFileTransferTargets(Array(100).fill(["source", "destination"]))
    ).not.toThrow();
  });

  it.each([
    undefined,
    [],
    new Array(1),
    [new Array(2)],
    [["source", ""]],
    [[1, "target"]],
    Array(101).fill(["source", "target"])
  ])("rejects malformed and oversized batches (%#)", (targets) =>
    expect(() => validateFileTransferTargets(targets)).toThrow()
  );
});

describe("file task reservations", () => {
  it("reserves synchronously, enforces per-instance limits and releases once", () => {
    const info = { fileLock: 0 };
    const first = acquireFileTask(info);
    const second = acquireFileTask(info);
    expect(() => acquireFileTask(info)).toThrow();
    expect(globalEnv.fileTaskCount).toBe(2);
    first();
    first();
    expect(info.fileLock).toBe(1);
    second();
    expect(globalEnv.fileTaskCount).toBe(0);
  });

  it("enforces the global quota across different instances", () => {
    const releases = [0, 1, 2].map(() => acquireFileTask({ fileLock: 0 }));
    expect(() => acquireFileTask({ fileLock: 0 })).toThrow();
    releases.forEach((release) => release());
    expect(globalEnv.fileTaskCount).toBe(0);
  });

  it.each([0, -1, NaN, Infinity, 1.5])("fails closed on invalid quota %s", (limit) => {
    globalConfiguration.config.maxGlobalFileTask = limit;
    expect(() => acquireFileTask({ fileLock: 0 })).toThrow();
    expect(globalEnv.fileTaskCount).toBe(0);
  });
});
