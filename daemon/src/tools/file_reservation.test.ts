import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { reserveFileOperation, reserveFileWrite } from "./file_reservation";

describe.skipIf(process.platform !== "linux")("file reservations", () => {
  let root: string;
  let workspace: string;
  let other: string;
  let releases: Array<() => void>;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "mcsm-reservation-"));
    workspace = path.join(root, "instance");
    other = path.join(root, "instance-other");
    await fs.mkdir(workspace);
    await fs.mkdir(other);
    await fs.writeFile(path.join(workspace, "file"), "original");
    releases = [];
  });

  afterEach(async () => {
    for (const release of releases.reverse()) release();
    await fs.remove(root);
  });

  function write(base: string, name: string) {
    const reservation = reserveFileWrite(base, path.join(base, name));
    releases.push(reservation.release);
    return reservation;
  }

  function operation(base: string, name = "file") {
    const release = reserveFileOperation(base, [path.join(base, name)]);
    releases.push(release);
    return release;
  }

  it("allows concurrent writes to different files, but not an overlapping operation", () => {
    const first = write(workspace, "file");
    const second = write(workspace, "new");
    expect(() => operation(workspace)).toThrow();
    first.release();
    expect(() => operation(workspace)).toThrow();
    second.release();
    const release = operation(workspace);
    expect(() => write(workspace, "unrelated")).toThrow();
    release();
    release();
    expect(() => write(workspace, "unrelated")).not.toThrow();
  });

  it("keeps unrelated workspaces concurrent and uses path component boundaries", () => {
    operation(workspace);
    const releaseOther = operation(other);
    releaseOther();
    expect(() => write(other, "new")).not.toThrow();
    expect(() => operation(other)).toThrow();
  });

  it("recognizes workspace aliases and nested workspace scopes in both directions", async () => {
    const alias = path.join(root, "alias");
    const nested = path.join(workspace, "nested");
    await fs.symlink(workspace, alias);
    await fs.mkdir(nested);
    const release = operation(alias);
    expect(() => write(nested, "file")).toThrow();
    expect(() => operation(workspace)).toThrow();
    release();
    const writer = write(nested, "file");
    expect(() => operation(alias)).toThrow();
    writer.release();
    expect(() => operation(alias)).not.toThrow();
  });

  it("recognizes hard-link targets across workspaces in both operation orders", async () => {
    await fs.link(path.join(workspace, "file"), path.join(other, "alias"));
    const writer = write(other, "alias");
    expect(() => operation(workspace)).toThrow();
    writer.release();
    const release = operation(workspace);
    expect(() => write(other, "alias")).toThrow();
    release();
    expect(() => write(other, "alias")).not.toThrow();
  });

  it("updates a write's inode identity without releasing its workspace access", async () => {
    const writer = write(workspace, "new");
    await fs.writeFile(path.join(workspace, "new"), "created");
    writer.updateIdentity(await fs.stat(path.join(workspace, "new")));
    expect(() => operation(workspace)).toThrow();
    writer.release();
    expect(() => writer.updateIdentity(fs.statSync(path.join(workspace, "new")))).toThrow();
    expect(() => operation(workspace)).not.toThrow();
  });
});
