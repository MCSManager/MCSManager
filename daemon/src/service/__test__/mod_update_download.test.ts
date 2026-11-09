import fs from "fs-extra";
import { createServer, type Server } from "http";
import os from "os";
import path from "path";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const sandbox = { root: "" };
vi.mock("../system_instance", () => ({
  default: {
    getInstance: () => ({ absoluteCwdPath: () => sandbox.root, config: { type: "minecraft/java" } })
  }
}));
vi.mock("../../utils/url", () => ({
  checkSafeUrl: async (url: string) => new URL(url).hostname === "127.0.0.1"
}));

import downloadManager from "../download_manager";
import { ModService } from "../mod_service";

let server: Server;
let url: string;
beforeAll(async () => {
  vi.stubEnv("no_proxy", "127.0.0.1");
  vi.stubEnv("NO_PROXY", "127.0.0.1");
  server = createServer((req, res) => {
    if (req.url === "/failure") {
      res.writeHead(403);
      res.end();
      return;
    }
    if (req.url === "/slow") {
      res.writeHead(200, { "content-length": "1000" });
      res.write("partial");
      return;
    }
    res.end("replacement");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  url = `http://127.0.0.1:${(server.address() as any).port}`;
});
afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  vi.unstubAllEnvs();
});
beforeEach(async () => {
  sandbox.root = await fs.mkdtemp(path.join(os.tmpdir(), "mod-transfer-"));
  await fs.outputFile(path.join(sandbox.root, "mods/old.jar"), "working");
});
afterEach(async () => {
  for (const task of downloadManager.tasks) task.controller.abort();
  downloadManager.tasks = [];
  await fs.remove(sandbox.root);
});
const install = (endpoint: string) =>
  new ModService().installMod("instance", url + endpoint, "old.jar", "mod", {
    oldFileName: "old.jar"
  });

describe("mod replacement with a real HTTP transfer", () => {
  it("installs the completed file", async () => {
    await install("/success");
    expect(await fs.readFile(path.join(sandbox.root, "mods/old.jar"), "utf8")).toBe("replacement");
    expect(await fs.readdir(path.join(sandbox.root, "mods"))).toEqual(["old.jar"]);
  });

  it("keeps the working jar when the server rejects the download", async () => {
    await expect(install("/failure")).rejects.toThrow("403");
    expect(await fs.readFile(path.join(sandbox.root, "mods/old.jar"), "utf8")).toBe("working");
  });

  it("keeps the working jar before and after canceling a partial transfer", async () => {
    const pending = install("/slow");
    const outcome = pending.then(
      () => null,
      (error: Error) => error
    );
    let task;
    for (let i = 0; i < 200; i++) {
      task = downloadManager.tasks.find((task) => task.current > 0 && task.status === 0);
      if (task) break;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(task).toBeDefined();
    expect(await fs.readFile(path.join(sandbox.root, "mods/old.jar"), "utf8")).toBe("working");
    downloadManager.stopById(task!.id);
    expect(await outcome).toBeInstanceOf(Error);
    expect(await fs.readFile(path.join(sandbox.root, "mods/old.jar"), "utf8")).toBe("working");
    expect(await fs.readdir(path.join(sandbox.root, "mods"))).toEqual(["old.jar"]);
  });
});
