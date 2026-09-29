import path from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { globalConfiguration } from "../entity/config";
import { invoke, packetsFor, flush } from "../../test/harness/router";
import { fakeInstance, mockInstanceSystem } from "../../test/harness/mocks";

// --- Inline mocks for everything java_manager_router pulls in at load time ---

// noOp logger (auth_router + java_manager_router both read `../service/log`).
vi.mock("../service/log", () => {
  const f: any = () => {};
  f.info = f;
  f.debug = f;
  f.warn = f;
  f.error = f;
  return { default: f };
});

// download_manager: `java_manager/download` calls `downloadFromUrl(url, path)`.
// Keep it as a vi.fn spy so the real axios / fs / stream-throttle chain never runs.
vi.mock("../service/download_manager", () => ({
  default: {
    tasks: [] as any[],
    downloadingCount: 0,
    downloadFromUrl: vi.fn(async () => undefined)
  }
}));

// java_manager service: EVERY event delegates here. Stub the full exported surface
// from `daemon/src/service/java_manager.ts` (default-exported singleton instance)
// so the router can run without pulling axios / fs / os / InstanceSubsystem.
vi.mock("../service/java_manager", () => ({
  default: {
    list: vi.fn(() => []),
    addJava: vi.fn(),
    exists: vi.fn(() => false),
    getJava: vi.fn(() => ({ info: { downloading: false } })),
    getJavaDownloadUrl: vi.fn(async () => "https://example.com/jdk.tar.gz"),
    getJavaDataDir: vi.fn(() => "/tmp/JavaData"),
    updateJavaInfo: vi.fn(),
    removeJava: vi.fn(async () => true)
  }
}));

// system_file: `java_manager/add` reads the static `FileManager.checkFileName`;
// the download handler news up `new FileManager(javaPath, "UTF-8")` and calls
// `.unzip` (only for `.zip` URLs). Stub both shapes.
vi.mock("../service/system_file", () => {
  class FileManager {
    static checkFileName = vi.fn(() => true);
    unzip = vi.fn(async () => undefined);
  }
  return { default: FileManager };
});

// system_instance: `java_manager/using` reads the instance via getInstance and
// throws if missing. The instance-existence check is a handler-level guard (NOT
// a routerApp.use middleware), so we seed a single fake instance and assert via
// the handler's throw when an unknown uuid is requested.
vi.mock("../service/system_instance", () => {
  const inst = fakeInstance("i1", {
    config: { startCommand: "/usr/bin/java -jar server.jar" }
  });
  const base = mockInstanceSystem([inst]);
  return { default: { ...base.default } };
});

// fs-extra: `java_manager/download` touches mkdirsSync / existsSync / stat /
// readdir / move / remove. Replace with vi.fn no-ops so no disk I/O happens.
vi.mock("fs-extra", () => {
  const mod: any = {
    existsSync: vi.fn(() => false),
    mkdirsSync: vi.fn(),
    stat: vi.fn(async () => ({ isDirectory: () => false })),
    readdir: vi.fn(async () => []),
    move: vi.fn(async () => undefined),
    remove: vi.fn(async () => undefined)
  };
  return { ...mod, default: mod };
});

// tar: `java_manager/download` extracts via `tar.extract({file, cwd, strip})`
// for `.tar.gz` URLs. Stub it so no binary spawn / disk read happens.
vi.mock("tar", () => ({ extract: vi.fn(async () => undefined) }));

// Register the top-level auth gate (auth_router) + java_manager handlers on the
// singleton routerApp.
import "./auth_router";
import "./java_manager_router";
import javaManager from "../service/java_manager";
import downloadManager from "../service/download_manager";
import FileManager from "../service/system_file";
import InstanceSubsystem from "../service/system_instance";
import { extract as tarExtract } from "tar";

const getInstance = (uuid: string): any =>
  (InstanceSubsystem as any).getInstance(uuid);

beforeEach(() => {
  globalConfiguration.config.key = "test-key";
  vi.clearAllMocks();
  // Restore default mock implementations that individual tests may override.
  (javaManager as any).list.mockImplementation(() => []);
  (javaManager as any).exists.mockImplementation(() => false);
  (javaManager as any).addJava.mockImplementation(() => undefined);
  (javaManager as any).getJava.mockImplementation(() => ({
    info: { downloading: false }
  }));
  (javaManager as any).getJavaDownloadUrl.mockImplementation(
    async () => "https://example.com/jdk.tar.gz"
  );
  (javaManager as any).getJavaDataDir.mockImplementation(() => "/tmp/JavaData");
  (javaManager as any).updateJavaInfo.mockImplementation(() => undefined);
  (javaManager as any).removeJava.mockImplementation(async () => true);
  (FileManager as any).checkFileName.mockImplementation(() => true);
});

const AUTHED = (id = "sx") => ({
  key: "test-key",
  login: true,
  id,
  type: "TOP_LEVEL",
  stream: {}
});

describe("java_manager_router", () => {
  // ---- java_manager/list ----
  it("java_manager/list: returns javaManager.list() -> {200, array}", async () => {
    (javaManager as any).list.mockImplementation(() => [
      { info: { name: "zulu_21" }, path: "/JavaData/zulu_21" }
    ]);
    const { socket } = invoke("java_manager/list", null, { session: AUTHED() });
    await flush();
    expect(javaManager.list).toHaveBeenCalledTimes(1);
    const pkt = packetsFor(socket, "java_manager/list")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toEqual([
      { info: { name: "zulu_21" }, path: "/JavaData/zulu_21" }
    ]);
  });

  // ---- java_manager/add ----
  it("java_manager/add: checkFileName + path.normalize + addJava -> {200, true}", async () => {
    const data = { name: "jdk8", path: "/usr/local/jdk8/bin/.." };
    const { socket } = invoke("java_manager/add", data, { session: AUTHED() });
    await flush();
    expect(FileManager.checkFileName).toHaveBeenCalledWith("jdk8");
    expect(javaManager.exists).toHaveBeenCalledWith("jdk8");
    expect(javaManager.addJava).toHaveBeenCalledTimes(1);
    const info = (javaManager.addJava as any).mock.calls[0][0];
    expect(info.fullname).toBe("jdk8");
    expect(info.path).toBe(path.normalize("/usr/local/jdk8/bin/.."));
    const pkt = packetsFor(socket, "java_manager/add")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toBe(true);
  });

  it("java_manager/add: invalid name (checkFileName=false) -> {500} and addJava NOT called", async () => {
    (FileManager as any).checkFileName.mockImplementation(() => false);
    const { socket } = invoke(
      "java_manager/add",
      { name: "../bad", path: "/x" },
      { session: AUTHED() }
    );
    await flush();
    expect(javaManager.addJava).not.toHaveBeenCalled();
    const pkt = packetsFor(socket, "java_manager/add")[0];
    expect(pkt.status).toBe(500);
  });

  it("java_manager/add: existing fullname (javaManager.exists=true) -> {500}", async () => {
    (javaManager as any).exists.mockImplementation(() => true);
    const { socket } = invoke(
      "java_manager/add",
      { name: "jdk8", path: "/x" },
      { session: AUTHED() }
    );
    await flush();
    expect(javaManager.addJava).not.toHaveBeenCalled();
    const pkt = packetsFor(socket, "java_manager/add")[0];
    expect(pkt.status).toBe(500);
  });

  // ---- java_manager/download ----
  it("java_manager/download: new java -> pre-responds {200, true} then async downloads + tar.extract for .tar.gz", async () => {
    const { socket } = invoke(
      "java_manager/download",
      { name: "zulu", version: "21" },
      { session: AUTHED() }
    );
    await flush();
    // The router pre-responds synchronously with 200/true before the async chain.
    expect(javaManager.addJava).toHaveBeenCalledTimes(1);
    const info = (javaManager.addJava as any).mock.calls[0][0];
    expect(info.fullname).toBe("zulu_21");
    expect(info.downloading).toBe(false); // reset by the success path
    expect(javaManager.getJavaDownloadUrl).toHaveBeenCalledWith(info);
    expect(downloadManager.downloadFromUrl).toHaveBeenCalledWith(
      "https://example.com/jdk.tar.gz",
      "/tmp/JavaData/zulu_21/jdk.tar.gz"
    );
    expect(javaManager.getJava).toHaveBeenCalledWith("zulu_21");
    expect(tarExtract).toHaveBeenCalledTimes(1);
    expect(tarExtract).toHaveBeenCalledWith({
      file: "/tmp/JavaData/zulu_21/jdk.tar.gz",
      cwd: "/tmp/JavaData/zulu_21",
      strip: 1
    });
    expect(javaManager.updateJavaInfo).toHaveBeenCalledWith(info);
    // Single 200 packet; the async success path does NOT emit an error packet.
    const pkts = packetsFor(socket, "java_manager/download");
    expect(pkts).toHaveLength(1);
    expect(pkts[0].status).toBe(200);
    expect(pkts[0].data).toBe(true);
  });

  it("java_manager/download: existing fullname -> {500} and addJava NOT called", async () => {
    (javaManager as any).exists.mockImplementation(() => true);
    const { socket } = invoke(
      "java_manager/download",
      { name: "zulu", version: "21" },
      { session: AUTHED() }
    );
    await flush();
    expect(javaManager.addJava).not.toHaveBeenCalled();
    expect(downloadManager.downloadFromUrl).not.toHaveBeenCalled();
    expect(tarExtract).not.toHaveBeenCalled();
    const pkts = packetsFor(socket, "java_manager/download");
    expect(pkts).toHaveLength(1);
    expect(pkts[0].status).toBe(500);
  });

  // ---- java_manager/using ----
  it("java_manager/using: rewrites startCommand[0] to {mcsm_java} and forwards to instance.parameters -> {200, true}", async () => {
    const inst = getInstance("i1");
    const { socket } = invoke(
      "java_manager/using",
      { instanceId: "i1", id: "zulu_21" },
      { session: AUTHED() }
    );
    await flush();
    expect(inst.parameters).toHaveBeenCalledWith({
      java: { id: "zulu_21" },
      startCommand: "{mcsm_java} -jar server.jar"
    });
    const pkt = packetsFor(socket, "java_manager/using")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toBe(true);
  });

  it("java_manager/using: unknown instanceId (handler-level gate) -> {500}", async () => {
    const { socket } = invoke(
      "java_manager/using",
      { instanceId: "does-not-exist", id: "j" },
      { session: AUTHED() }
    );
    await flush();
    const pkt = packetsFor(socket, "java_manager/using")[0];
    expect(pkt.status).toBe(500);
    // The handler never reaches instance.parameters when the instance is missing.
    expect(getInstance("i1").parameters).not.toHaveBeenCalled();
  });

  // ---- java_manager/delete ----
  it("java_manager/delete: removeJava(id) -> {200, true}", async () => {
    const { socket } = invoke(
      "java_manager/delete",
      { id: "jdk8" },
      { session: AUTHED() }
    );
    await flush();
    expect(javaManager.removeJava).toHaveBeenCalledWith("jdk8");
    const pkt = packetsFor(socket, "java_manager/delete")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toBe(true);
  });

  it("java_manager/delete: removeJava rejects -> {500}", async () => {
    (javaManager as any).removeJava.mockRejectedValue(new Error("not found"));
    const { socket } = invoke(
      "java_manager/delete",
      { id: "jdk8" },
      { session: AUTHED() }
    );
    await flush();
    const pkt = packetsFor(socket, "java_manager/delete")[0];
    expect(pkt.status).toBe(500);
  });
});
