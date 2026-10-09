import { Readable } from "node:stream";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("axios", () => ({ default: vi.fn() }));
vi.mock("../entity/config", () => ({
  globalConfiguration: { config: { uploadSpeedRate: 0 } }
}));
vi.mock("../utils/url", () => ({ checkSafeUrl: vi.fn(async () => true) }));

import axios from "axios";
import downloadManager, { DOWNLOAD_STATUS } from "./download_manager";

describe("download ownership completion", () => {
  let workspace: string;

  beforeEach(async () => {
    workspace = await fs.mkdtemp(path.join(os.tmpdir(), "mcsm-download-owner-"));
    downloadManager.tasks = [];
    vi.mocked(axios).mockReset();
  });

  afterEach(async () => {
    await fs.remove(workspace);
    // The manager retires completed/failed tasks after one second.
    await new Promise((resolve) => setTimeout(resolve, 1100));
    downloadManager.tasks = [];
  });

  function response() {
    return { status: 200, headers: {}, data: Readable.from([Buffer.from("downloaded")]) };
  }

  it("waits for ownership synchronization before reporting completion", async () => {
    vi.mocked(axios).mockResolvedValue(response());
    const target = path.join(workspace, "download");
    const synchronize = vi.fn(async () => {
      expect(await fs.readFile(target, "utf8")).toBe("downloaded");
      expect(downloadManager.tasks[0].status).toBe(DOWNLOAD_STATUS.DOWNLOADING);
    });

    await downloadManager.downloadFromUrl(
      "https://example.invalid/file",
      target,
      undefined,
      synchronize
    );
    expect(synchronize).toHaveBeenCalledOnce();
    expect(downloadManager.tasks[0].status).toBe(DOWNLOAD_STATUS.COMPLETED);
  });

  it("reports a synchronization failure instead of a successful download", async () => {
    vi.mocked(axios).mockResolvedValue(response());
    const synchronize = vi.fn(async () => {
      throw new Error("ownership permission denied");
    });

    await expect(
      downloadManager.downloadFromUrl(
        "https://example.invalid/file",
        path.join(workspace, "download"),
        undefined,
        synchronize
      )
    ).rejects.toThrow("ownership permission denied");
    expect(downloadManager.tasks[0].status).toBe(DOWNLOAD_STATUS.ERROR);
    expect(synchronize).toHaveBeenCalledOnce();
  });

  it("retains the ownership callback when using the fallback download", async () => {
    vi.mocked(axios)
      .mockRejectedValueOnce(new Error("not found"))
      .mockResolvedValueOnce(response());
    const synchronize = vi.fn(async () => {});

    await downloadManager.downloadFromUrl(
      "https://example.invalid/file",
      path.join(workspace, "download"),
      "https://example.invalid/fallback",
      synchronize
    );
    expect(synchronize).toHaveBeenCalledOnce();
    expect(downloadManager.tasks).toHaveLength(1);
    expect(downloadManager.tasks[0].status).toBe(DOWNLOAD_STATUS.COMPLETED);
  });

  it("does not overwrite a stream failure while synchronization is pending", async () => {
    const download = response();
    vi.mocked(axios).mockResolvedValue(download);
    let release!: () => void;
    let started!: () => void;
    const synchronizing = new Promise<void>((resolve) => (started = resolve));
    const synchronizationComplete = new Promise<void>((resolve) => (release = resolve));
    const result = downloadManager.downloadFromUrl(
      "https://example.invalid/file",
      path.join(workspace, "download"),
      undefined,
      async () => {
        started();
        await synchronizationComplete;
      }
    );
    const rejected = expect(result).rejects.toThrow("stream failed");
    await synchronizing;
    download.data.emit("error", new Error("stream failed"));
    await rejected;
    release();
    await new Promise((resolve) => setImmediate(resolve));
    expect(downloadManager.tasks[0].status).toBe(DOWNLOAD_STATUS.ERROR);
  });
});
