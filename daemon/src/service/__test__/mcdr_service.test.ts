import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { resolveMCDRServerRoot, TYPE_MINECRAFT_MCDR } from "../mcdr_service";

const sandbox = { root: "", instanceCwd: "" };

beforeAll(() => {
  sandbox.root = fs.mkdtempSync(path.join(os.tmpdir(), "mcs-mcdr-"));
  sandbox.instanceCwd = path.join(sandbox.root, "instance");
  fs.mkdirSync(sandbox.instanceCwd, { recursive: true });
});

afterAll(() => {
  if (sandbox.root) fs.removeSync(sandbox.root);
});

function writeConfig(content: string) {
  fs.writeFileSync(path.join(sandbox.instanceCwd, "config.yml"), content);
}

describe("resolveMCDRServerRoot", () => {
  it("returns null for non-MCDR type", () => {
    writeConfig("working_directory: /tmp");
    expect(resolveMCDRServerRoot("universal/java", sandbox.instanceCwd)).toBeNull();
  });

  it("returns null when config.yml is missing", () => {
    fs.removeSync(path.join(sandbox.instanceCwd, "config.yml"));
    expect(resolveMCDRServerRoot(TYPE_MINECRAFT_MCDR, sandbox.instanceCwd)).toBeNull();
  });

  it("returns null when working_directory is absent", () => {
    writeConfig("debug: true");
    expect(resolveMCDRServerRoot(TYPE_MINECRAFT_MCDR, sandbox.instanceCwd)).toBeNull();
  });

  it("resolves a relative working_directory inside the instance", () => {
    writeConfig("working_directory: server");
    expect(resolveMCDRServerRoot(TYPE_MINECRAFT_MCDR, sandbox.instanceCwd)).toBe(
      path.join(sandbox.instanceCwd, "server")
    );
  });

  it("resolves '.' to the instance root", () => {
    writeConfig("working_directory: .");
    expect(resolveMCDRServerRoot(TYPE_MINECRAFT_MCDR, sandbox.instanceCwd)).toBe(
      sandbox.instanceCwd
    );
  });

  it("rejects working_directory that escapes the instance via '..'", () => {
    writeConfig("working_directory: ../outside");
    expect(resolveMCDRServerRoot(TYPE_MINECRAFT_MCDR, sandbox.instanceCwd)).toBeNull();
  });

  it("rejects working_directory: '/' (root — would bypass all FileManager checks)", () => {
    writeConfig("working_directory: /");
    expect(resolveMCDRServerRoot(TYPE_MINECRAFT_MCDR, sandbox.instanceCwd)).toBeNull();
  });

  it("rejects an absolute working_directory outside the instance", () => {
    writeConfig(`working_directory: ${path.join(sandbox.root, "outside")}`);
    expect(resolveMCDRServerRoot(TYPE_MINECRAFT_MCDR, sandbox.instanceCwd)).toBeNull();
  });

  it("rejects a deep relative escape", () => {
    writeConfig("working_directory: a/../../..");
    expect(resolveMCDRServerRoot(TYPE_MINECRAFT_MCDR, sandbox.instanceCwd)).toBeNull();
  });

  it("accepts an absolute working_directory inside the instance", () => {
    const sub = path.join(sandbox.instanceCwd, "server");
    fs.mkdirSync(sub, { recursive: true });
    writeConfig(`working_directory: ${sub}`);
    expect(resolveMCDRServerRoot(TYPE_MINECRAFT_MCDR, sandbox.instanceCwd)).toBe(sub);
    fs.removeSync(sub);
  });
});
