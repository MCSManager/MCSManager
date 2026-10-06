import type Docker from "dockerode";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertMatchingDockerNamespace,
  DockerFileOwnershipService,
  resolveRootlessFileOwnership
} from "./docker_file_ownership";

const namespaceMap = "0 1005 1\n1 165536 65536\n";
const hostMap = "0 0 4294967295\n";
const runtime = {
  uid: 0,
  gid: 0,
  socketUid: 0,
  socketGid: 0,
  uidMap: namespaceMap,
  gidMap: namespaceMap
};

afterEach(() => vi.restoreAllMocks());

describe("Rootless Docker file identity", () => {
  it.each(["0:0", "1000:1000", "65536:65536"])("keeps mapped namespace IDs for %s", (user) => {
    const [uid, gid] = user.split(":").map(Number);
    expect(resolveRootlessFileOwnership(user, runtime, runtime)).toEqual({ uid, gid });
  });

  it("maps container root to the verified local engine account for a host Daemon", () => {
    const hostRuntime = {
      uid: 1005,
      gid: 1005,
      socketUid: 1005,
      socketGid: 1005,
      uidMap: hostMap,
      gidMap: hostMap
    };
    expect(resolveRootlessFileOwnership("0:0", hostRuntime, runtime)).toEqual({
      uid: 1005,
      gid: 1005
    });
    expect(() => resolveRootlessFileOwnership("1000:1000", hostRuntime, runtime)).toThrow();
    expect(() =>
      resolveRootlessFileOwnership("0:0", { ...hostRuntime, socketUid: 1006 }, runtime)
    ).toThrow();
  });

  it.each(["1000", "root", "root:root", "-1:0", "4294967295:0", "65537:0"])(
    "rejects ambiguous, invalid or unmapped user %s",
    (user) => expect(() => resolveRootlessFileOwnership(user, runtime, runtime)).toThrow()
  );

  it("rejects host root, a different socket owner and unconfirmed user namespaces", () => {
    expect(() =>
      resolveRootlessFileOwnership("0:0", { ...runtime, uidMap: hostMap }, runtime)
    ).toThrow();
    expect(() =>
      resolveRootlessFileOwnership("0:0", { ...runtime, socketUid: 65534 }, runtime)
    ).toThrow();
    expect(() =>
      resolveRootlessFileOwnership("0:0", { ...runtime, gidMap: "invalid" }, runtime)
    ).toThrow();
  });

  it("does not mistake the socket's Docker group for the engine's primary group", () => {
    expect(
      resolveRootlessFileOwnership("1000:1000", { ...runtime, socketGid: 999 }, runtime)
    ).toEqual({ uid: 1000, gid: 1000 });
    const hostRuntime = {
      ...runtime,
      uid: 1005,
      gid: 1005,
      socketUid: 1005,
      socketGid: 166534,
      uidMap: hostMap,
      gidMap: hostMap
    };
    expect(resolveRootlessFileOwnership("0:0", hostRuntime, runtime)).toEqual({
      uid: 1005,
      gid: 1005
    });
    expect(() =>
      resolveRootlessFileOwnership("0:0", hostRuntime, {
        ...runtime,
        gidMap: "0 1006 1\n1 165536 65536"
      })
    ).toThrow();
  });

  it("requires both kernel maps to match the engine's namespace", () => {
    expect(() => assertMatchingDockerNamespace(runtime, runtime)).not.toThrow();
    expect(() =>
      assertMatchingDockerNamespace(runtime, { ...runtime, uidMap: "0 1005 1\n1 300000 65536" })
    ).toThrow();
    expect(() => assertMatchingDockerNamespace(runtime, { ...runtime, gidMap: hostMap })).toThrow();
  });
});

function service(rootless = true, user = "1000:1000", socketPath = "/run/docker.sock") {
  const info = vi.fn(async () => ({ SecurityOptions: rootless ? ["name=rootless"] : [] }));
  const inspect = vi.fn(async () => ({ Config: { User: user } }) as Docker.ImageInspectInfo);
  const getImage = vi.fn(() => ({ inspect }) as unknown as Docker.Image);
  const getContainer = vi.fn();
  const readRuntime = vi.fn(async () => runtime);
  const readNamespace = vi.fn(async () => runtime);
  return {
    resolver: new DockerFileOwnershipService(
      { info, getImage, getContainer },
      socketPath,
      readRuntime,
      readNamespace
    ),
    info,
    inspect,
    readRuntime,
    readNamespace
  };
}

describe.skipIf(process.platform !== "linux")("Docker ownership metadata", () => {
  it("preserves Rootful behavior without inspecting image USER or namespace maps", async () => {
    const test = service(false);
    expect(await test.resolver.resolve("1000:1000", "test-image")).toEqual({ rootless: false });
    expect(test.inspect).not.toHaveBeenCalled();
    expect(test.readRuntime).not.toHaveBeenCalled();
  });

  it("uses image USER only when runAs is empty", async () => {
    const test = service();
    expect(await test.resolver.resolve("", "test-image")).toEqual({
      rootless: true,
      ownership: { uid: 1000, gid: 1000 },
      user: "1000:1000",
      resourceLimits: { memory: false, cpu: false }
    });
    expect((await test.resolver.resolve("0:0", "test-image")).ownership).toEqual({
      uid: 0,
      gid: 0
    });
    expect(test.inspect).toHaveBeenCalledTimes(1);
  });

  it("uses container root for an image with no USER", async () => {
    const test = service(true, "");
    expect((await test.resolver.resolve("", "test-image")).ownership).toEqual({ uid: 0, gid: 0 });
  });

  it("deduplicates concurrent engine checks and caches metadata", async () => {
    const test = service();
    await Promise.all(
      Array.from({ length: 20 }, () => test.resolver.resolve("1000:1000", "test-image"))
    );
    await test.resolver.resolve("1000:1000", "test-image");
    expect(test.info).toHaveBeenCalledTimes(1);
    expect(test.readNamespace).toHaveBeenCalledTimes(1);
  });

  it("does not retain failed verification", async () => {
    const test = service();
    test.readNamespace.mockRejectedValueOnce(new Error("unreachable"));
    await expect(test.resolver.resolve("1000:1000", "test-image")).rejects.toThrow();
    await expect(test.resolver.resolve("1000:1000", "test-image")).resolves.toMatchObject({
      rootless: true
    });
    expect(test.info).toHaveBeenCalledTimes(2);
  });

  it("rejects remote Rootless engines before applying host IDs", async () => {
    const test = service(true, "1000:1000", "");
    await expect(test.resolver.resolve("1000:1000", "test-image")).rejects.toThrow();
    expect(test.readRuntime).not.toHaveBeenCalled();
  });

  it("expires engine and image metadata", async () => {
    const test = service();
    const now = vi.spyOn(Date, "now").mockReturnValue(1000);
    await test.resolver.resolve("", "test-image");
    now.mockReturnValue(32_000);
    await test.resolver.resolve("", "test-image");
    expect(test.info).toHaveBeenCalledTimes(2);
    expect(test.inspect).toHaveBeenCalledTimes(2);
  });
});
