import { beforeEach, describe, expect, it, vi } from "vitest";

import { globalConfiguration } from "../entity/config";
import { dispatch, packetsFor, flush } from "../../test/harness/router";

// --- Inline mocks for the deps environment_router reads at load time ---

// noOp logger.
vi.mock("../service/log", () => {
  const f: any = () => {};
  f.info = f;
  f.debug = f;
  f.warn = f;
  f.error = f;
  return { default: f };
});

// fs-extra: environment/new_image writes a Dockerfile to tmp/<uuid>/Dockerfile.
// Stub the calls so no disk I/O happens. The namespace import (`import * as fs`)
// and the default import (`import fs` in common/system_storage) both resolve to
// this object via the `default` alias.
vi.mock("fs-extra", () => {
  const mod: any = {
    existsSync: vi.fn(() => false),
    mkdirsSync: vi.fn(),
    mkdirSync: vi.fn(),
    writeFile: vi.fn(async () => undefined),
    readFile: vi.fn(async () => ""),
    readdirSync: vi.fn(() => []),
    writeFileSync: vi.fn(),
    renameSync: vi.fn(),
    readFileSync: vi.fn(() => ""),
    removeSync: vi.fn(),
    ensureDir: vi.fn(async () => undefined),
    pathExists: vi.fn(async () => false),
    copy: vi.fn(async () => undefined),
    move: vi.fn(async () => undefined),
    remove: vi.fn(async () => undefined)
  };
  return { ...mod, default: mod };
});

// DockerManager: every event constructs `new DockerManager()` then reads dockerode
// methods via `.getDocker()`, plus static `builderProgress` for environment/progress.
// Stub the boundary surface so no docker daemon is needed.
vi.mock("../service/docker_service", () => {
  const imageStub: any = { remove: vi.fn(async () => undefined) };
  const dockerStub: any = {
    listImages: vi.fn(async () => [{ Id: "img-1", RepoTags: ["a:latest"] }]),
    listContainers: vi.fn(async () => [{ Id: "c-1", Names: ["c1"] }]),
    listNetworks: vi.fn(async () => [{ Name: "bridge" }]),
    getImage: vi.fn(() => imageStub),
    buildImage: vi.fn(async () => undefined)
  };
  return {
    DockerManager: class {
      public static readonly builderProgress = new Map<string, number>();
      public getDocker() {
        return dockerStub;
      }
      public async startBuildImage(_dir: string, name: string) {
        (this.constructor as any).builderProgress.set(name, 1);
      }
      public async getImagePlatforms(_name: string) {
        return ["linux/amd64", "linux/arm64"];
      }
      public async getSupportedPlatforms() {
        return ["linux/amd64"];
      }
    },
    DefaultDocker: class {}
  };
});

// Register the top-level gate (auth_router) + environment handlers on the singleton.
import "./auth_router";
import "./environment_router";
import { DockerManager } from "../service/docker_service";

const getDockerStub = (): any => new (DockerManager as any)().getDocker();

beforeEach(() => {
  globalConfiguration.config.key = "test-key";
  vi.clearAllMocks();
  // builderProgress is a static real Map; clearAllMocks won't touch it.
  (DockerManager as any).builderProgress.clear();
});

const AUTHED = (id = "s1") => ({
  key: "test-key",
  login: true,
  id,
  type: "TOP_LEVEL",
  stream: {}
});

describe("environment_router", () => {
  // ---- list handlers ----
  it("environment/images -> docker.listImages + packet shape", async () => {
    const { socket } = dispatch("environment/images", null, { session: AUTHED() });
    await flush();
    const pkt = packetsFor(socket, "environment/images")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toEqual([{ Id: "img-1", RepoTags: ["a:latest"] }]);
    expect(getDockerStub().listImages).toHaveBeenCalled();
  });

  it("environment/containers -> docker.listContainers + packet shape", async () => {
    const { socket } = dispatch("environment/containers", null, { session: AUTHED() });
    await flush();
    const pkt = packetsFor(socket, "environment/containers")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toEqual([{ Id: "c-1", Names: ["c1"] }]);
    expect(getDockerStub().listContainers).toHaveBeenCalled();
  });

  it("environment/networkModes -> docker.listNetworks + adds host/none when missing", async () => {
    const { socket } = dispatch("environment/networkModes", null, { session: AUTHED() });
    await flush();
    const pkt = packetsFor(socket, "environment/networkModes")[0];
    expect(pkt.status).toBe(200);
    const names = pkt.data.map((n: any) => n.Name);
    expect(names).toContain("bridge");
    expect(names).toContain("host");
    expect(names).toContain("none");
    expect(getDockerStub().listNetworks).toHaveBeenCalled();
  });

  it("environment/networkModes -> keeps host when docker already reports it (no duplicate)", async () => {
    getDockerStub().listNetworks.mockResolvedValueOnce([
      { Name: "bridge" },
      { Name: "host" }
    ]);
    const { socket } = dispatch("environment/networkModes", null, { session: AUTHED() });
    await flush();
    const pkt = packetsFor(socket, "environment/networkModes")[0];
    expect(pkt.status).toBe(200);
    const names = pkt.data.map((n: any) => n.Name);
    expect(names.filter((n: string) => n === "host")).toHaveLength(1);
    expect(names).toContain("none");
  });

  // ---- progress: reads DockerManager.builderProgress ----
  it("environment/progress -> maps builderProgress entries to a plain object", async () => {
    (DockerManager as any).builderProgress.set("myimg:latest", 1);
    (DockerManager as any).builderProgress.set("other:1.0", 2);
    const { socket } = dispatch("environment/progress", null, { session: AUTHED() });
    await flush();
    const pkt = packetsFor(socket, "environment/progress")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toEqual({ "myimg:latest": 1, "other:1.0": 2 });
  });

  it("environment/progress -> empty map yields {} (still 200)", async () => {
    const { socket } = dispatch("environment/progress", null, { session: AUTHED() });
    await flush();
    const pkt = packetsFor(socket, "environment/progress")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toEqual({});
  });

  // ---- new_image: pre-respond + async buildImage ----
  it("environment/new_image -> pre-responds {200, true} then async startBuildImage", async () => {
    const { socket } = dispatch(
      "environment/new_image",
      { dockerFile: "FROM scratch", name: "myimg", tag: "1.0" },
      { session: AUTHED() }
    );
    await flush();
    const pkt = packetsFor(socket, "environment/new_image")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toBe(true);
    // startBuildImage sets builderProgress[<name>:<tag>] = 1 as a side effect.
    expect((DockerManager as any).builderProgress.get("myimg:1.0")).toBe(1);
  });

  it("environment/new_image -> writes Dockerfile content via fs.writeFile", async () => {
    const fs = (await import("fs-extra")) as any;
    dispatch(
      "environment/new_image",
      { dockerFile: "FROM node:18", name: "n", tag: "x" },
      { session: AUTHED() }
    );
    await flush();
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining("Dockerfile"),
      "FROM node:18",
      { encoding: "utf-8" }
    );
  });

  // ---- del_image -> getImage(id).remove() ----
  it("environment/del_image -> calls getImage(id).remove() and acks true", async () => {
    const { socket } = dispatch(
      "environment/del_image",
      { imageId: "img-123" },
      { session: AUTHED() }
    );
    await flush();
    const pkt = packetsFor(socket, "environment/del_image")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toBe(true);
    const stub = getDockerStub();
    expect(stub.getImage).toHaveBeenCalledWith("img-123");
    expect(stub.getImage("img-123").remove).toHaveBeenCalled();
  });

  // ---- image_platforms: delegates to DockerManager.getImagePlatforms ----
  it("environment/image_platforms -> returns platforms from DockerManager.getImagePlatforms", async () => {
    const { socket } = dispatch(
      "environment/image_platforms",
      { imageName: "ubuntu:latest" },
      { session: AUTHED() }
    );
    await flush();
    const pkt = packetsFor(socket, "environment/image_platforms")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toEqual(["linux/amd64", "linux/arm64"]);
  });

  it("environment/image_platforms -> requires imageName -> 500 when missing", async () => {
    const { socket } = dispatch("environment/image_platforms", {}, { session: AUTHED() });
    await flush();
    const pkt = packetsFor(socket, "environment/image_platforms")[0];
    expect(pkt.status).toBe(500);
  });

  // ---- top-level gate: all environment/* events require top-level auth ----
  it("gate: environment/images without login -> {500, IGNORE}", async () => {
    const { socket } = dispatch("environment/images", null, { session: {} });
    await flush();
    const pkt = packetsFor(socket, "environment/images")[0];
    expect(pkt.status).toBe(500);
  });
});
