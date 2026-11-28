import fs from "node:fs";
import path from "node:path";
import type { ChildProcess } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createUser,
  loginSessionRetry,
  REPO,
  requestPanel,
  saveState,
  waitFor,
  world
} from "../lib";
import { groupKill, spawnApp } from "../lib/process";

let restartedPanel: ChildProcess | undefined;
let phoneUrl: string;
let savedLayout: IPageLayoutConfig[];

const credentials = (role: "admin" | "u1") => ({
  cookie: world[role].cookie,
  token: world[role].token
});

async function readLayout(): Promise<IPageLayoutConfig[]> {
  const response = await requestPanel({ method: "GET", path: "/overview/layout" });
  expect(response.httpStatus).toBe(200);
  return JSON.parse(response.data);
}

function upload(role?: "admin" | "u1") {
  const boundary = "mcsm-appearance-upload";
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aOYQAAAAASUVORK5CYII=",
    "base64"
  );
  return requestPanel({
    method: "POST",
    path: "/overview/upload_assets",
    ...(role ? credentials(role) : {}),
    headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
    body: Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="phone.png"\r\nContent-Type: image/png\r\n\r\n`
      ),
      png,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ])
  });
}

beforeAll(async () => {
  for (const [role, permission] of [
    ["admin", 10],
    ["u1", 1]
  ] as const) {
    const user = world[role];
    const created = await createUser(user.name, user.pass, permission, world.key);
    expect(created.uuid).toBeTruthy();
    user.uuid = created.uuid;
    await loginSessionRetry(role);
  }
  saveState();
});

afterAll(async () => {
  await groupKill(restartedPanel ?? null);
});

describe("panel appearance: upload, persistence, and permissions", () => {
  it("publishes an empty phone background in a new layout", async () => {
    const layout = await readLayout();
    expect(layout.find((page) => page.page === "__settings__")?.theme?.pBgUrl).toBe("");
  });

  it("allows a real administrator session to upload the phone asset", async () => {
    const result = await upload("admin");
    expect(result.httpStatus).toBe(200);
    expect(result.data).toMatch(/^[\da-f-]+\.png$/i);
    phoneUrl = `/upload_files/${result.data}`;
    const asset = path.join(world.workDir, "panel/public", phoneUrl);
    expect(fs.existsSync(asset)).toBe(true);
  });

  it("saves both URLs and preserves custom theme and layout data", async () => {
    savedLayout = await readLayout();
    const settings = savedLayout.find((page) => page.page === "__settings__")!;
    Object.assign(settings.theme!, {
      pageTitle: "Appearance regression",
      logoImage: "/upload_files/logo.png",
      backgroundImage: "/upload_files/desktop.png",
      pBgUrl: phoneUrl,
      sidebarPosition: "left"
    });
    savedLayout.push({ page: "/appearance-regression", items: [] });
    const result = await requestPanel({
      method: "POST",
      path: "/overview/layout",
      ...credentials("admin"),
      body: savedLayout
    });
    expect(result.httpStatus).toBe(200);
    expect(await readLayout()).toEqual(savedLayout);
    const diskLayout = JSON.parse(
      fs.readFileSync(path.join(world.workDir, "panel/data/layout.json"), "utf8")
    );
    expect(diskLayout).toEqual(savedLayout);
  });

  it.each([undefined, "u1"] as const)("rejects appearance writes from %s", async (role) => {
    const layout = await readLayout();
    layout.find((page) => page.page === "__settings__")!.theme!.pBgUrl = "forbidden.png";
    const response = await requestPanel({
      method: "POST",
      path: "/overview/layout",
      ...(role ? credentials(role) : {}),
      body: layout
    });
    expect(response.httpStatus).toBe(403);
    const assetDirectory = path.join(world.workDir, "panel/public/upload_files");
    const assetsBefore = fs.readdirSync(assetDirectory);
    const rejectedUpload = await upload(role);
    // The existing multipart precheck rejects before routing with Koa's generic 500 response.
    expect(rejectedUpload.httpStatus).toBe(500);
    expect(rejectedUpload.data).toBe("Internal Server Error");
    expect(fs.readdirSync(assetDirectory)).toEqual(assetsBefore);
    expect(await readLayout()).toEqual(savedLayout);
  });

  it("returns both backgrounds publicly after restarting the isolated panel", async () => {
    expect(world.panelPid).toBeTruthy();
    process.kill(world.panelPid!, "SIGTERM");
    await waitFor(
      () => {
        try {
          process.kill(world.panelPid!, 0);
          return false;
        } catch {
          return true;
        }
      },
      { timeout: 15000, msg: "original test panel exits" }
    );
    restartedPanel = spawnApp({
      app: path.join(REPO, "panel/production/app.js"),
      args: [`--unsafe-integration-test-mode=${world.key}`],
      cwd: path.join(world.workDir, "panel"),
      logFile: path.join(world.workDir, "panel-restarted.log")
    });
    await waitFor(
      async () => {
        const response = await requestPanel({
          method: "GET",
          path: "/overview/layout",
          timeout: 1000
        });
        return response.httpStatus === 200;
      },
      { timeout: 40000, msg: "restarted test panel ready" }
    );
    expect(await readLayout()).toEqual(savedLayout);
    expect(fs.existsSync(path.join(world.workDir, "panel/public", phoneUrl))).toBe(true);
  });
});
