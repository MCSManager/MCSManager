/**
 * Scheduled-task name security
 * ============================
 *
 * ATTACKER PROFILE: A regular panel user that owns a single instance.
 * TARGET: The daemon's storage directory (`daemon/data`).
 *
 * ATTACK CHAIN:
 *   1. The panel forwards `DELETE /protected_schedule?task_name=<name>` to the
 *      daemon as `schedule/delete { instanceUuid, name }`.
 *   2. The daemon persists scheduled tasks as
 *      `data/TaskConfig/<instanceUuid>_<name>.json` and deletes the file with
 *      `StorageSubsystem.delete("TaskConfig", `${instanceUuid}_${name}`)`.
 *   3. A `name` such as `../../Config/global` therefore resolves to
 *      `data/Config/global.json` — the node's own panel<->daemon shared key
 *      (or any other instance's config) — and the delete removes it.
 *
 * A test PASSES when the attack is BLOCKED. Legitimate deletion is covered by
 * the last case so the guard cannot be satisfied by simply refusing everything.
 */
import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("../log", () => {
  const f: any = () => {};
  f.info = f;
  f.debug = f;
  f.warn = f;
  f.error = f;
  return { default: f };
});

vi.mock("../i18n", () => ({
  $t: (key: string) => key,
  t: (key: string) => key
}));

let workDir: string;
let dataDir: string;
let control: any;
let globalKey: string;

beforeAll(async () => {
  // StorageSubsystem.DATA_PATH is derived from process.cwd() at import time, so
  // chdir into a throw-away directory before loading the singleton.
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcsm-schedule-name-"));
  process.chdir(workDir);
  dataDir = path.join(workDir, "data");
  fs.mkdirsSync(path.join(dataDir, "TaskConfig"));
  fs.writeFileSync(path.join(dataDir, "TaskConfig", "instance-1_backup.json"), "{}");
  control = (await import("../system_instance_control")).default;
  // The real daemon config (with its random panel<->daemon key) is created by
  // the module graph above; that file is the high-value target of the attack.
  globalKey = JSON.parse(
    fs.readFileSync(path.join(dataDir, "Config", "global.json"), "utf-8")
  ).key;
  expect(globalKey).toBeTruthy();
});

afterAll(() => {
  process.chdir(path.dirname(workDir));
  fs.removeSync(workDir);
});

describe("scheduled task name is validated on delete (issue #2428 item 1)", () => {
  const globalConfigPath = () => path.join(dataDir, "Config", "global.json");

  it("blocks a POSIX traversal name and keeps global.json intact", () => {
    expect(() => control.deleteScheduleTask("instance-1", "../../Config/global")).toThrow();
    expect(fs.existsSync(globalConfigPath())).toBe(true);
    expect(JSON.parse(fs.readFileSync(globalConfigPath(), "utf-8")).key).toBe(globalKey);
  });

  it("blocks a Windows traversal name and keeps global.json intact", () => {
    expect(() => control.deleteScheduleTask("instance-1", "..\\..\\Config\\global")).toThrow();
    expect(fs.existsSync(globalConfigPath())).toBe(true);
    expect(JSON.parse(fs.readFileSync(globalConfigPath(), "utf-8")).key).toBe(globalKey);
  });

  it("blocks an absolute path", () => {
    expect(() => control.deleteScheduleTask("instance-1", "/etc/passwd")).toThrow();
    expect(fs.existsSync(globalConfigPath())).toBe(true);
  });

  it("blocks a name that tries to address another instance's task file", () => {
    expect(() => control.deleteScheduleTask("instance-1", "../instance-2/backup")).toThrow();
    expect(fs.existsSync(path.join(dataDir, "TaskConfig", "instance-1_backup.json"))).toBe(true);
  });

  it("still deletes a legitimate task", () => {
    const file = path.join(dataDir, "TaskConfig", "instance-1_backup.json");
    expect(fs.existsSync(file)).toBe(true);
    control.deleteScheduleTask("instance-1", "backup");
    expect(fs.existsSync(file)).toBe(false);
    expect(fs.existsSync(globalConfigPath())).toBe(true);
  });
});
