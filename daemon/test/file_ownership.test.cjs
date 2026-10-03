const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const fs = require("fs-extra");

const daemonRoot = path.resolve(__dirname, "..");
require("ts-node").register({ project: path.join(daemonRoot, "tsconfig.test.json") });
require("tsconfig-paths").register({
  baseUrl: daemonRoot,
  paths: {
    "@languages/*": ["../languages/*"],
    "mcsmanager-common": ["../common/src/index.ts"]
  }
});

const {
  resolveInstanceFileOwnership,
  syncPathOwnershipWithinRoot
} = require("../src/tools/file_ownership");

const linuxOnly = { skip: process.platform !== "linux" };

async function withWorkspace(callback) {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), "mcsm-ownership-"));
  const root = path.join(base, "workspace");
  const outside = path.join(base, "outside");
  await fs.ensureDir(root);
  await fs.ensureDir(outside);
  try {
    await callback({ base, root, outside });
  } finally {
    await fs.remove(base);
  }
}

function currentOwnership() {
  return { uid: process.getuid(), gid: process.getgid() };
}

test("resolves supported runAs forms and leaves unsupported forms unchanged", linuxOnly, async () => {
  const instance = { config: { runAs: "1000:1000" } };
  assert.deepEqual(await resolveInstanceFileOwnership(instance), { uid: 1000, gid: 1000 });

  instance.config.runAs = os.userInfo().username;
  assert.deepEqual(await resolveInstanceFileOwnership(instance), currentOwnership());

  instance.config.runAs = "1000";
  assert.equal(await resolveInstanceFileOwnership(instance), undefined);
  instance.config.runAs = "";
  assert.equal(await resolveInstanceFileOwnership(instance), undefined);

  instance.config.runAs = "4294967295:1000";
  await assert.rejects(resolveInstanceFileOwnership(instance), /Invalid UID/);
});

test("changes ownership of files and directories by descriptor", linuxOnly, async () => {
  await withWorkspace(async ({ root }) => {
    const directory = path.join(root, "nested");
    const file = path.join(directory, "save.dat");
    await fs.ensureDir(directory);
    await fs.writeFile(file, "save");

    const originalFchown = fs.fchown;
    let changed = 0;
    fs.fchown = async (...args) => {
      changed++;
      return originalFchown(...args);
    };
    try {
      await syncPathOwnershipWithinRoot(root, file, currentOwnership());
      await syncPathOwnershipWithinRoot(root, directory, currentOwnership());
    } finally {
      fs.fchown = originalFchown;
    }

    assert.equal(changed, 2);
    assert.equal((await fs.stat(file)).uid, process.getuid());
    assert.equal((await fs.stat(directory)).gid, process.getgid());
  });
});

test("rejects paths outside the workspace and stable symlinked parents", linuxOnly, async () => {
  await withWorkspace(async ({ root, outside }) => {
    const file = path.join(outside, "save.dat");
    await fs.writeFile(file, "outside");
    await assert.rejects(
      syncPathOwnershipWithinRoot(root, file, currentOwnership()),
      /Invalid ownership target/
    );

    const link = path.join(root, "linked-parent");
    await fs.symlink(outside, link, "dir");
    await assert.rejects(
      syncPathOwnershipWithinRoot(root, path.join(link, "save.dat"), currentOwnership()),
      /escapes instance workspace/
    );
  });
});

test("does not change a final symlink or its external target", linuxOnly, async () => {
  await withWorkspace(async ({ root, outside }) => {
    const outsideFile = path.join(outside, "save.dat");
    const link = path.join(root, "linked-file");
    await fs.writeFile(outsideFile, "outside");
    await fs.symlink(outsideFile, link);

    const originalFchown = fs.fchown;
    fs.fchown = async () => {
      throw new Error("fchown must not run for symlinks");
    };
    try {
      await syncPathOwnershipWithinRoot(root, link, currentOwnership());
    } finally {
      fs.fchown = originalFchown;
    }
    assert.equal(await fs.readFile(outsideFile, "utf8"), "outside");
  });
});

test("rejects a parent symlink swapped after validation", linuxOnly, async () => {
  await withWorkspace(async ({ root, outside }) => {
    const parent = path.join(root, "nested");
    const target = path.join(parent, "save.dat");
    await fs.ensureDir(parent);
    await fs.writeFile(target, "inside");
    await fs.writeFile(path.join(outside, "save.dat"), "outside");

    const originalRealpath = fs.realpath;
    const originalFchown = fs.fchown;
    let changed = 0;
    fs.realpath = async (...args) => {
      const result = await originalRealpath(...args);
      if (args[0] === target) {
        await fs.rename(parent, path.join(root, "original-parent"));
        await fs.symlink(outside, parent, "dir");
      }
      return result;
    };
    fs.fchown = async (...args) => {
      changed++;
      return originalFchown(...args);
    };
    try {
      await assert.rejects(
        syncPathOwnershipWithinRoot(root, target, currentOwnership()),
        /target changed during validation/
      );
    } finally {
      fs.realpath = originalRealpath;
      fs.fchown = originalFchown;
    }
    assert.equal(changed, 0);
    assert.equal(await fs.readFile(path.join(outside, "save.dat"), "utf8"), "outside");
  });
});

test("reports missing entries so archive callers can skip them", linuxOnly, async () => {
  await withWorkspace(async ({ root }) => {
    await assert.rejects(
      syncPathOwnershipWithinRoot(root, path.join(root, "missing.dat"), currentOwnership()),
      { code: "ENOENT" }
    );
  });
});
