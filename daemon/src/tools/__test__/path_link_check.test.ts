import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { resolvePhysicalPath } from "../path_link_check";

// resolvePhysicalPath must mirror kernel path resolution: symbolic links are
// expanded in place, so a '..' AFTER a link applies to the directory the link
// resolved to. path.resolve()/path.normalize() collapse '..' textually and
// never observe the link — that difference is the containment-check bug
// (raw-value-vs-lexical-bounds-check).

const sandbox = {
  root: "",
  ws: "",
  outside: ""
};

// dir links: junctions work unprivileged on win32, dir symlinks elsewhere.
let linkOk = false;
// relative-target links need real symlinks (junction targets are absolutized).
let relLinkOk = false;

beforeAll(() => {
  sandbox.root = fs.mkdtempSync(path.join(os.tmpdir(), "mcs-phys-"));
  sandbox.ws = path.join(sandbox.root, "ws");
  sandbox.outside = path.join(sandbox.root, "outside");
  fs.mkdirSync(path.join(sandbox.ws, "sub"), { recursive: true });
  fs.mkdirSync(path.join(sandbox.outside, "deep"), { recursive: true });
  fs.writeFileSync(path.join(sandbox.ws, "plain.txt"), "PLAIN");
  fs.writeFileSync(path.join(sandbox.outside, "secret.txt"), "OUTSIDE");

  try {
    fs.symlinkSync(
      sandbox.outside,
      path.join(sandbox.ws, "link"),
      process.platform === "win32" ? "junction" : "dir"
    );
    linkOk = true;
  } catch {
    linkOk = false;
  }

  try {
    fs.symlinkSync(path.join("..", "outside"), path.join(sandbox.ws, "rellink"), "dir");
    relLinkOk = true;
  } catch {
    relLinkOk = false;
  }

  try {
    // self-referential link: a guaranteed cycle
    fs.symlinkSync(
      path.join(sandbox.ws, "loop"),
      path.join(sandbox.ws, "loop"),
      process.platform === "win32" ? "junction" : "dir"
    );
  } catch {
    linkOk = linkOk && false;
  }
});

afterAll(() => {
  if (sandbox.root) fs.removeSync(sandbox.root);
});

// path.join() would collapse '..' lexically and hide the physical semantics;
// only raw concatenation preserves the shape a client can send.
const raw = (...segs: string[]) => [sandbox.ws, ...segs].join(path.sep);

describe("resolvePhysicalPath: kernel-style physical resolution", () => {
  it("returns the path unchanged when no symbolic links are involved", () => {
    const plain = path.join(sandbox.ws, "plain.txt");
    expect(resolvePhysicalPath(plain)).toBe(plain);
  });

  it("keeps non-existent tail segments so callers can create files", () => {
    const pending = path.join(sandbox.ws, "nope", "deep", "file.txt");
    expect(resolvePhysicalPath(pending)).toBe(pending);
  });

  it("returns null for relative input (fail closed)", () => {
    expect(resolvePhysicalPath(path.join("relative", "path"))).toBeNull();
  });

  it("resolves an absolute directory link in place", () => {
    if (!linkOk) return;
    expect(resolvePhysicalPath(raw("link", "secret.txt"))).toBe(
      path.join(sandbox.outside, "secret.txt")
    );
  });

  it("applies '..' after a link to the link target's parent, not the link's", () => {
    if (!linkOk) return;
    // '<ws>/link/../marker.txt' physically means '<root>/marker.txt' because
    // link resolves to '<root>/outside' first — NOT '<ws>/marker.txt'.
    expect(resolvePhysicalPath(raw("link", "..", "marker.txt"))).toBe(
      path.join(sandbox.root, "marker.txt")
    );
  });

  it("resolves a relative link target against the link's own directory", () => {
    if (!relLinkOk) return;
    expect(resolvePhysicalPath(raw("rellink", "secret.txt"))).toBe(
      path.join(sandbox.outside, "secret.txt")
    );
    expect(resolvePhysicalPath(raw("rellink", "..", "marker.txt"))).toBe(
      path.join(sandbox.root, "marker.txt")
    );
  });

  it("returns null on a cyclic link chain (fail closed)", () => {
    if (!linkOk) return;
    expect(resolvePhysicalPath(path.join(sandbox.ws, "loop"))).toBeNull();
    expect(resolvePhysicalPath(path.join(sandbox.ws, "loop", "x.txt"))).toBeNull();
  });

  it("clamps '..' at the filesystem root", () => {
    const root = path.parse(sandbox.root).root;
    const rawBeyondRoot = root + ".." + path.sep + "marker.txt";
    expect(resolvePhysicalPath(rawBeyondRoot)).toBe(path.join(root, "marker.txt"));
  });
});
