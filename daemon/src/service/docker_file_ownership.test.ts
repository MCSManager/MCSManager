import type Docker from "dockerode";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertMatchingDockerNamespace,
  DockerFileOwnershipService,
  resolveRootlessFileOwnership
} from "./docker_file_ownership";

const namespaceMap = "0 1005 1\n1 165536 65536\n";
const hostMap = "0 0 4294967295\n";
const imageId = `sha256:${"a".repeat(64)}`;
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

function service(
  rootless = true,
  user = "1000:1000",
  socketPath = "/run/docker.sock",
  rootlessDeployment = rootless
) {
  const info = vi.fn(async () => ({ SecurityOptions: rootless ? ["name=rootless"] : [] }));
  const inspect = vi.fn(
    async () => ({ Id: imageId, Config: { User: user } }) as Docker.ImageInspectInfo
  );
  const getImage = vi.fn(() => ({ inspect }) as unknown as Docker.Image);
  const getContainer = vi.fn();
  const readRuntime = vi.fn(async () => runtime);
  const readNamespace = vi.fn(async () => runtime);
  return {
    resolver: new DockerFileOwnershipService(
      { info, getImage, getContainer },
      socketPath,
      readRuntime,
      readNamespace,
      rootlessDeployment
    ),
    info,
    inspect,
    getImage,
    getContainer,
    readRuntime,
    readNamespace
  };
}

describe.skipIf(process.platform !== "linux")("Docker ownership metadata", () => {
  it("keeps Rootful file operations independent of an offline engine", async () => {
    const test = service(false);
    test.info.mockRejectedValue(new Error("offline"));
    expect(await test.resolver.resolveForFiles("1000:1000", "game")).toEqual({ rootless: false });
    expect(test.info).not.toHaveBeenCalled();
    await expect(test.resolver.resolve("1000:1000", "game")).rejects.toThrow();
  });

  it("never falls back to host IDs when the Rootless engine is offline", async () => {
    const test = service();
    test.info.mockRejectedValue(new Error("offline"));
    await expect(test.resolver.resolveForFiles("1000:1000", "game")).rejects.toThrow();
    expect(test.inspect).not.toHaveBeenCalled();
  });

  it("rejects a Rootful engine in an explicitly Rootless deployment", async () => {
    const test = service(false, "1000:1000", "/run/docker.sock", true);
    await expect(test.resolver.resolveForFiles("1000:1000", "game")).rejects.toThrow();
  });

  it.each([
    { CgroupVersion: "1", CgroupDriver: "systemd" },
    { CgroupVersion: "2", CgroupDriver: "none" },
    { CgroupVersion: "2", CgroupDriver: "cgroupfs" }
  ])("does not trust resource flags without v2/systemd: %j", async (cgroup) => {
    const test = service();
    test.info.mockResolvedValue({
      SecurityOptions: ["name=rootless"],
      MemoryLimit: true,
      CpuCfsQuota: true,
      ...cgroup
    } as any);
    expect((await test.resolver.resolve("0:0", "test-image")).resourceLimits).toEqual({
      memory: false,
      cpu: false
    });
  });

  it("accepts reported memory/CPU capability only with v2/systemd", async () => {
    const test = service();
    test.info.mockResolvedValue({
      SecurityOptions: ["name=rootless"],
      CgroupVersion: "2",
      CgroupDriver: "systemd",
      MemoryLimit: true,
      CpuCfsQuota: true
    } as any);
    expect((await test.resolver.resolve("0:0", "test-image")).resourceLimits).toEqual({
      memory: true,
      cpu: true
    });
  });
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

  it("resolves retagged images immediately and pins the creation image ID", async () => {
    const test = service(true, "0:0");
    expect((await test.resolver.resolveForContainer("", "game:latest", "game:latest")).user).toBe(
      "0:0"
    );
    const nextId = `sha256:${"b".repeat(64)}`;
    test.inspect.mockResolvedValue({
      Id: nextId,
      Config: { User: "1000:1000" }
    } as Docker.ImageInspectInfo);
    expect(await test.resolver.resolveForContainer("", "game:latest", "game:latest")).toMatchObject(
      {
        user: "1000:1000",
        imageId: nextId,
        ownership: { uid: 1000, gid: 1000 }
      }
    );
    expect(test.inspect).toHaveBeenCalledTimes(2);
  });

  it("uses the main image identity for Docker updates, but the effective image for process updates", async () => {
    const test = service();
    test.getImage.mockImplementation(
      (image) =>
        ({
          inspect: async () => ({
            Id: imageId,
            Config: { User: image === "game" ? "1000:1000" : "0:0" }
          })
        }) as unknown as Docker.Image
    );
    expect((await test.resolver.resolveForContainer("", "game", "update")).user).toBe("1000:1000");
    expect((await test.resolver.resolveForContainer("", "update", "update")).user).toBe("0:0");
    expect((await test.resolver.resolveForContainer("1000:1000", "", "update")).user).toBe(
      "1000:1000"
    );
  });

  it("uses the actual assigned container's user rather than a changed tag or runAs", async () => {
    const test = service(true, "0:0");
    test.getContainer.mockReturnValue({
      inspect: async () => ({
        Config: { User: "1000:1000", Labels: { "mcsmanager.instance.uuid": "instance" } }
      })
    });
    expect(
      (
        await test.resolver.resolveForFiles("0:0", "game", {
          id: "container",
          instanceUuid: "instance"
        })
      ).user
    ).toBe("1000:1000");
    expect(test.inspect).not.toHaveBeenCalled();
    await expect(
      test.resolver.resolveForFiles("", "game", { id: "container", instanceUuid: "other" })
    ).rejects.toThrow();
  });

  it("deduplicates concurrent image reads without retaining stale values", async () => {
    const test = service();
    await Promise.all(Array.from({ length: 20 }, () => test.resolver.resolve("", "game")));
    expect(test.inspect).toHaveBeenCalledTimes(1);
    await test.resolver.resolve("", "game");
    expect(test.inspect).toHaveBeenCalledTimes(2);
  });

  it("releases failed image requests for a later retry", async () => {
    const test = service();
    test.inspect.mockRejectedValueOnce(new Error("unavailable"));
    await expect(test.resolver.resolve("", "game")).rejects.toThrow();
    await expect(test.resolver.resolve("", "game")).resolves.toMatchObject({ user: "1000:1000" });
    expect(test.inspect).toHaveBeenCalledTimes(2);
  });

  it.each([
    { Id: "game:latest", Config: { User: "1000:1000" } },
    { Id: imageId, Config: { User: 1000 } }
  ])("rejects unverifiable image metadata before container creation", async (info) => {
    const test = service();
    test.inspect.mockResolvedValue(info as Docker.ImageInspectInfo);
    await expect(test.resolver.resolveForContainer("", "game", "game")).rejects.toThrow();
  });

  it("does not use the next-start user when the active container cannot be verified", async () => {
    const test = service();
    test.getContainer.mockReturnValue({
      inspect: async () => {
        throw new Error("offline");
      }
    });
    await expect(
      test.resolver.resolveForFiles("0:0", "game", { id: "container", instanceUuid: "instance" })
    ).rejects.toThrow();
    expect(test.inspect).not.toHaveBeenCalled();
  });

  it("bounds concurrent requests for different images and releases capacity", async () => {
    const test = service();
    let release!: (value: Docker.ImageInspectInfo) => void;
    // Share a deferred response while retaining separate per-image requests.
    const response = new Promise<Docker.ImageInspectInfo>((resolve) => {
      release = resolve;
    });
    test.inspect.mockReturnValue(response);
    await test.resolver.resolve("0:0", "game");
    const requests = Array.from({ length: 32 }, (_, i) => test.resolver.resolve("", `game:${i}`));
    await Promise.resolve();
    await expect(test.resolver.resolve("", "excess")).rejects.toThrow();
    release({ Id: imageId, Config: { User: "0:0" } } as Docker.ImageInspectInfo);
    await Promise.all(requests);
    await expect(test.resolver.resolve("", "next")).resolves.toMatchObject({ user: "0:0" });
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

  it("expires engine verification without retaining image metadata", async () => {
    const test = service();
    const now = vi.spyOn(Date, "now").mockReturnValue(1000);
    await test.resolver.resolve("", "test-image");
    now.mockReturnValue(32_000);
    await test.resolver.resolve("", "test-image");
    expect(test.info).toHaveBeenCalledTimes(2);
    expect(test.inspect).toHaveBeenCalledTimes(2);
  });
});
