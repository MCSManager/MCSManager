import fs from "fs-extra";
import os from "os";
import path from "path";
import promises from "fs/promises";
import { Readable } from "stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("axios", () => ({ default: vi.fn() }));
vi.mock("../utils/url", () => ({ checkSafeUrl: vi.fn(async () => true) }));
vi.mock("./log", () => ({ default: { info: vi.fn(), error: vi.fn() } }));
vi.mock("./upload_manager", () => ({ default: { delete: vi.fn() } }));
vi.mock("../common/compress", () => ({
  compress: vi.fn(),
  decompress: vi.fn(),
  listArchiveEntries: vi.fn()
}));
vi.mock("../tools/file_ownership", async () => ({
  ...(await vi.importActual<object>("../tools/file_ownership")),
  resolveInstanceFileOwnership: vi.fn(async () => ({
    uid: process.getuid?.() ?? 0,
    gid: process.getgid?.() ?? 0,
    rootless: true
  }))
}));

import axios from "axios";
import FileManager from "./system_file";
import FileWriter from "../entity/file_writer";
import type Instance from "../entity/instance/instance";
import downloadManager from "./download_manager";
import { decompress } from "../common/compress";
import { openOwnedWriteFile, replaceOwnedFile } from "../tools/owned_write_file";
import { reserveFileOperation } from "../tools/file_reservation";

function barrier() {
  let entered!: () => void;
  let release!: () => void;
  let reject!: (error: Error) => void;
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const wait = new Promise<void>((resolve, fail) => {
    release = resolve;
    reject = fail;
  });
  return { entered, release, reject, started, wait };
}

describe.skipIf(process.platform !== "linux")("Rootless file operation lifetimes", () => {
  let workspace: string;
  let files: FileManager;
  const ownership = { uid: process.getuid?.() ?? 0, gid: process.getgid?.() ?? 0, rootless: true };

  beforeEach(async () => {
    workspace = await fs.mkdtemp(path.join(os.tmpdir(), "mcsm-operation-life-"));
    await fs.mkdir(path.join(workspace, "source"));
    await fs.writeFile(path.join(workspace, "source/file"), "original");
    await fs.symlink("source/file", path.join(workspace, "alias"));
    await fs.link(path.join(workspace, "source/file"), path.join(workspace, "hard-link"));
    await fs.writeFile(path.join(workspace, "input.zip"), "fixture");
    files = new FileManager(workspace, "utf-8", async () => ownership);
    downloadManager.tasks = [];
    vi.mocked(axios).mockReset();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.remove(workspace);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    downloadManager.tasks = [];
  });

  function pause(kind: string, gate: ReturnType<typeof barrier>): Promise<unknown> {
    if (kind === "unzip") {
      vi.spyOn(files as any, "getArchiveEntries").mockResolvedValue([
        { name: "file", isDirectory: false }
      ]);
      vi.mocked(decompress).mockImplementationOnce(async (_source, destination) => {
        gate.entered();
        await gate.wait;
        await fs.writeFile(path.join(destination, "file"), "extracted");
        return true;
      });
      return files.unzip("input.zip", "extracted", "utf-8", ownership);
    }
    if (kind === "delete") {
      const remove = fs.remove;
      vi.spyOn(fs, "remove").mockImplementationOnce(((
        target: string,
        callback: (error?: Error | null) => void
      ) => {
        gate.entered();
        void gate.wait.then(() => remove(target, callback), callback);
      }) as any);
      return files.delete("source");
    }
    const method = kind === "copy" ? "copyOwnedEntry" : "visitTree";
    const original = (files as any)[method].bind(files);
    vi.spyOn(files as any, method).mockImplementationOnce(async (...args: unknown[]) => {
      gate.entered();
      await gate.wait;
      return original(...args);
    });
    return kind === "copy" ? files.copy("source", "copied") : files.move("source", "moved");
  }

  it.each(["copy", "move", "delete", "unzip"])(
    "%s reserves its workspace across async waits and releases after success",
    async (kind) => {
      const gate = barrier();
      const operation = pause(kind, gate);
      const writer = new FileWriter(
        { absoluteCwdPath: () => workspace } as Instance,
        "file",
        4,
        false,
        "utf-8",
        path.join(workspace, "new/nested/file")
      );
      try {
        await gate.started;
        for (const name of ["source/file", "alias", "hard-link", "new/nested/file"])
          await expect(
            openOwnedWriteFile(workspace, path.join(workspace, name), ownership)
          ).rejects.toThrow();
        await expect(writer.init()).rejects.toThrow();
        await expect(
          replaceOwnedFile(
            workspace,
            path.join(workspace, "alias"),
            ownership,
            path.join(workspace, "source/file"),
            8
          )
        ).rejects.toThrow();
        const body = Readable.from([Buffer.from("download")]);
        vi.mocked(axios).mockResolvedValue({ status: 200, headers: {}, data: body });
        await expect(
          downloadManager.downloadFromUrl(
            "https://example.invalid/file",
            path.join(workspace, "new/download"),
            undefined,
            undefined,
            { workspace, ownership }
          )
        ).rejects.toThrow();
        expect(body.destroyed).toBe(true);
        expect(await fs.pathExists(path.join(workspace, "new"))).toBe(false);
        expect(await fs.readFile(path.join(workspace, "source/file"), "utf8")).toBe("original");
        gate.release();
        await operation;
        const after = await openOwnedWriteFile(workspace, path.join(workspace, "after"), ownership);
        await after.close();
      } finally {
        gate.release();
        await operation.catch(() => {});
        await writer.stop();
      }
    }
  );

  it("reserves write access before creating missing parents", async () => {
    const gate = barrier();
    const mkdir = promises.mkdir;
    vi.spyOn(promises, "mkdir").mockImplementationOnce(
      async (...args: Parameters<typeof mkdir>) => {
        gate.entered();
        await gate.wait;
        return mkdir(...args);
      }
    );
    const opening = openOwnedWriteFile(
      workspace,
      path.join(workspace, "new/nested/file"),
      ownership
    );
    try {
      await gate.started;
      await expect(files.move("source", "moved")).rejects.toThrow();
      await expect(files.copy("source", "copied")).rejects.toThrow();
      expect(await fs.pathExists(path.join(workspace, "moved"))).toBe(false);
      expect(await fs.pathExists(path.join(workspace, "copied"))).toBe(false);
    } finally {
      gate.release();
      const target = await opening;
      await target.close();
    }
    const release = reserveFileOperation(workspace, [path.join(workspace, "source")]);
    release();
  });

  it("releases write access when the first descriptor cannot be opened", async () => {
    vi.spyOn(promises, "open").mockRejectedValueOnce(new Error("open failed"));
    await expect(
      openOwnedWriteFile(workspace, path.join(workspace, "new"), ownership)
    ).rejects.toThrow("open failed");
    const release = reserveFileOperation(workspace, [path.join(workspace, "source")]);
    release();
    expect(await fs.pathExists(path.join(workspace, "new"))).toBe(false);
  });

  it.each(["copy", "move", "delete", "unzip"])(
    "%s releases its reservation after failure",
    async (kind) => {
      const gate = barrier();
      const operation = pause(kind, gate);
      try {
        await gate.started;
        const rejected = expect(operation).rejects.toThrow("controlled failure");
        gate.reject(new Error("controlled failure"));
        await rejected;
        const after = await openOwnedWriteFile(workspace, path.join(workspace, "after"), ownership);
        await after.close();
        expect(await fs.readFile(path.join(workspace, "source/file"), "utf8")).toBe("original");
      } finally {
        gate.release();
        await operation.catch(() => {});
      }
    }
  );
});
