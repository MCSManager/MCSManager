import { PassThrough, Readable } from "node:stream";
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

  async function waitForTransfer(body: Readable) {
    const deadline = Date.now() + 3000;
    while (body.listenerCount("data") === 0 && Date.now() < deadline)
      await new Promise((resolve) => setTimeout(resolve, 5));
    expect(body.listenerCount("data")).toBeGreaterThan(0);
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

  const ownership = { uid: process.getuid?.() ?? 0, gid: process.getgid?.() ?? 0, rootless: true };

  it.skipIf(process.platform !== "linux")(
    "downloads through an internal symlink without replacing it",
    async () => {
      await fs.writeFile(path.join(workspace, "actual"), "old");
      const link = path.join(workspace, "link");
      await fs.symlink("actual", link);
      vi.mocked(axios).mockResolvedValue(response());
      await downloadManager.downloadFromUrl(
        "https://example.invalid/file",
        link,
        undefined,
        undefined,
        { workspace, ownership }
      );
      expect(await fs.readFile(path.join(workspace, "actual"), "utf8")).toBe("downloaded");
      expect((await fs.lstat(link)).isSymbolicLink()).toBe(true);
      expect(downloadManager.tasks[0].status).toBe(DOWNLOAD_STATUS.COMPLETED);
    }
  );

  it.skipIf(process.platform !== "linux")(
    "closes an owned destination on stream failure",
    async () => {
      const body = new PassThrough();
      vi.mocked(axios).mockResolvedValue({ status: 200, headers: {}, data: body });
      const filename = path.join(workspace, "partial");
      const result = downloadManager.downloadFromUrl(
        "https://example.invalid/file",
        filename,
        undefined,
        undefined,
        { workspace, ownership }
      );
      const rejected = expect(result).rejects.toThrow("stream failed");
      await waitForTransfer(body);
      body.destroy(new Error("stream failed"));
      await rejected;
      expect(body.destroyed).toBe(true);
      expect(downloadManager.tasks[0].status).toBe(DOWNLOAD_STATUS.ERROR);
    }
  );

  it.skipIf(process.platform !== "linux")(
    "cancels using the pinned target rather than a replaced link",
    async () => {
      const body = new PassThrough();
      vi.mocked(axios).mockResolvedValue({ status: 200, headers: {}, data: body });
      const filename = path.join(workspace, "partial");
      const result = downloadManager.downloadFromUrl(
        "https://example.invalid/file",
        filename,
        undefined,
        undefined,
        { workspace, ownership }
      );
      await waitForTransfer(body);
      await fs.rename(filename, path.join(workspace, "original"));
      await fs.writeFile(filename, "replacement");
      expect(downloadManager.stop(filename)).toBe(true);
      await result;
      expect(body.destroyed).toBe(true);
      expect(await fs.readFile(filename, "utf8")).toBe("replacement");
      expect(downloadManager.tasks).toHaveLength(0);
    }
  );
});
