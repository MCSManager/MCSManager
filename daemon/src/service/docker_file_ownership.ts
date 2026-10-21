import type Docker from "dockerode";
import fs from "fs-extra";
import { $t } from "../i18n";
import type { FileOwnership } from "../tools/file_ownership";
import { DefaultDocker } from "./docker_service";

interface NamespaceMaps {
  uidMap: string;
  gidMap: string;
}

interface IdMapRange {
  inside: number;
  outside: number;
  length: number;
}

export interface DockerOwnershipRuntime extends NamespaceMaps {
  uid: number;
  gid: number;
  socketUid: number;
  socketGid: number;
}

export interface DockerFileIdentity {
  rootless: boolean;
  ownership?: FileOwnership;
  user?: string;
  imageId?: string;
  resourceLimits?: { memory: boolean; cpu: boolean };
}

function unsupported(): Error {
  return new Error($t("TXT_CODE_rootless.unsupportedIdentity"));
}

function parseIdMap(text: string): IdMapRange[] {
  if (text.length > 32768) throw unsupported();
  const lines = text.trim().split("\n");
  if (lines.length > 340) throw unsupported();
  return lines.map((line) => {
    const parts = line.trim().split(/\s+/);
    if (parts.length !== 3 || parts.some((part) => !/^\d+$/.test(part))) throw unsupported();
    const [inside, outside, length] = parts.map(Number);
    if (
      ![inside, outside, length].every(Number.isSafeInteger) ||
      length < 1 ||
      inside + length > 0xffffffff ||
      outside + length > 0xffffffff
    ) {
      throw unsupported();
    }
    return { inside, outside, length };
  });
}

function isMapped(id: number, ranges: IdMapRange[]): boolean {
  return ranges.some((range) => id >= range.inside && id < range.inside + range.length);
}

function isRootlessNamespace(ranges: IdMapRange[]): boolean {
  return ranges.some((range) => range.inside === 0 && range.outside > 0 && range.length === 1);
}

export function assertMatchingDockerNamespace(runtime: NamespaceMaps, engine: NamespaceMaps): void {
  if (
    JSON.stringify(parseIdMap(runtime.uidMap)) !== JSON.stringify(parseIdMap(engine.uidMap)) ||
    JSON.stringify(parseIdMap(runtime.gidMap)) !== JSON.stringify(parseIdMap(engine.gidMap))
  ) {
    throw unsupported();
  }
}

/** Translate only deployments whose local engine account can be verified. */
export function resolveRootlessFileOwnership(
  user: string,
  runtime: DockerOwnershipRuntime,
  engineMaps: NamespaceMaps
): FileOwnership {
  if (user.length > 21) throw new Error($t("TXT_CODE_rootless.numericUserRequired"));
  const numericIds = user.match(/^(\d+):(\d+)$/);
  if (!numericIds) throw new Error($t("TXT_CODE_rootless.numericUserRequired"));
  const [uid, gid] = numericIds.slice(1).map(Number);
  if (![uid, gid].every((id) => Number.isSafeInteger(id) && id >= 0 && id < 0xffffffff)) {
    throw new Error($t("TXT_CODE_rootless.numericUserRequired"));
  }

  const uidMap = parseIdMap(runtime.uidMap);
  const gidMap = parseIdMap(runtime.gidMap);
  if (
    runtime.uid === 0 &&
    runtime.gid === 0 &&
    runtime.socketUid === 0 &&
    isRootlessNamespace(uidMap) &&
    isRootlessNamespace(gidMap) &&
    isMapped(uid, uidMap) &&
    isMapped(gid, gidMap)
  ) {
    assertMatchingDockerNamespace(runtime, engineMaps);
    // The socket belongs to namespace root, whose parent UID/GID are nonzero.
    // Files and sibling containers share the local Rootless engine's ID space.
    return { uid, gid };
  }

  const isHostNamespace = (ranges: IdMapRange[]) =>
    ranges.length === 1 &&
    ranges[0].inside === 0 &&
    ranges[0].outside === 0 &&
    ranges[0].length === 0xffffffff;
  if (
    uid === 0 &&
    gid === 0 &&
    runtime.uid > 0 &&
    runtime.gid > 0 &&
    runtime.socketUid === runtime.uid &&
    isHostNamespace(uidMap) &&
    isHostNamespace(gidMap)
  ) {
    const engineUid = parseIdMap(engineMaps.uidMap).find(
      (range) => range.inside === 0 && range.length === 1
    );
    const engineGid = parseIdMap(engineMaps.gidMap).find(
      (range) => range.inside === 0 && range.length === 1
    );
    if (engineUid?.outside === runtime.uid && engineGid?.outside === runtime.gid) {
      return { uid: engineUid.outside, gid: engineGid.outside };
    }
  }
  throw unsupported();
}

const CACHE_TTL_MS = 30_000;
const MAX_IMAGE_REQUESTS = 32;

interface ImageIdentity {
  id: string;
  user: string;
}

export class DockerFileOwnershipService {
  private engine?: {
    rootless: boolean;
    expires: number;
    runtime?: DockerOwnershipRuntime;
    namespace?: NamespaceMaps;
    resourceLimits: { memory: boolean; cpu: boolean };
  };
  private engineRequest?: Promise<NonNullable<DockerFileOwnershipService["engine"]>>;
  private readonly imageRequests = new Map<string, Promise<ImageIdentity>>();

  constructor(
    private readonly docker: Pick<Docker, "info" | "getImage" | "getContainer"> = new DefaultDocker(
      {
        timeout: 5000
      }
    ),
    private readonly socketPath = DefaultDocker.defaultConfig.socketPath,
    private readonly readRuntime = readDockerOwnershipRuntime,
    private readonly readEngineNamespace = readRootlessEngineNamespace,
    private readonly rootlessDeployment = Boolean(process.env.MCSM_ROOTLESS_DOCKER_CONTAINER)
  ) {}

  public async resolveForFiles(
    runAs: string,
    image: string,
    container?: { id: string; instanceUuid: string }
  ): Promise<DockerFileIdentity> {
    // Rootless is an administrator opt-in. Offline Rootful file operations must
    // not depend on an engine probe or infer host IDs after a failed probe.
    if (!this.rootlessDeployment) return { rootless: false };
    const engine = await this.getEngine();
    if (!engine.rootless) throw unsupported();
    if (!container) return this.resolve(runAs, image);
    // A running instance keeps its creation-time identity even if its tag or
    // configured runAs has since changed. Never apply the next boot's owner to it.
    let info: Docker.ContainerInspectInfo;
    try {
      info = await this.docker.getContainer(container.id).inspect();
    } catch {
      throw new Error($t("TXT_CODE_rootless.engineUnavailable"));
    }
    if (info.Config.Labels?.["mcsmanager.instance.uuid"] !== container.instanceUuid)
      throw unsupported();
    return this.identityForUser(info.Config.User || "0:0", engine);
  }

  private async getEngine() {
    if (this.engine && this.engine.expires > Date.now()) return this.engine;
    if (this.engineRequest) return this.engineRequest;
    this.engineRequest = (async () => {
      let info: {
        SecurityOptions?: string[];
        MemoryLimit?: boolean;
        CpuCfsQuota?: boolean;
        CgroupVersion?: string;
        CgroupDriver?: string;
      };
      try {
        info = await this.docker.info();
      } catch {
        throw new Error($t("TXT_CODE_rootless.engineUnavailable"));
      }
      if (
        process.platform === "linux" &&
        (!Array.isArray(info.SecurityOptions) ||
          info.SecurityOptions.some((option) => typeof option !== "string"))
      ) {
        throw new Error($t("TXT_CODE_rootless.engineUnavailable"));
      }
      const rootless = info.SecurityOptions?.some((option) => option === "name=rootless") ?? false;
      if (this.rootlessDeployment && !rootless) throw unsupported();
      let runtime: DockerOwnershipRuntime | undefined;
      let namespace: NamespaceMaps | undefined;
      if (rootless) {
        if (process.platform !== "linux" || !this.socketPath?.startsWith("/")) throw unsupported();
        try {
          runtime = await this.readRuntime(this.socketPath);
        } catch {
          throw unsupported();
        }
        try {
          namespace = await this.readEngineNamespace(this.docker);
          resolveRootlessFileOwnership("0:0", runtime, namespace);
        } catch {
          throw new Error($t("TXT_CODE_rootless.namespaceUnavailable"));
        }
      }
      this.engine = {
        rootless,
        runtime,
        namespace,
        expires: Date.now() + CACHE_TTL_MS,
        resourceLimits: {
          memory:
            info.CgroupVersion === "2" &&
            info.CgroupDriver === "systemd" &&
            info.MemoryLimit === true,
          cpu:
            info.CgroupVersion === "2" &&
            info.CgroupDriver === "systemd" &&
            info.CpuCfsQuota === true
        }
      };
      return this.engine;
    })();
    try {
      return await this.engineRequest;
    } finally {
      this.engineRequest = undefined;
    }
  }

  public async resolve(runAs: string, image: string): Promise<DockerFileIdentity> {
    const engine = await this.getEngine();
    if (!engine.rootless) return { rootless: false };

    const user = runAs.trim() || (await this.inspectImage(image)).user;
    return this.identityForUser(user, engine);
  }

  public async resolveForContainer(
    runAs: string,
    identityImage: string,
    effectiveImage: string
  ): Promise<DockerFileIdentity> {
    const engine = await this.getEngine();
    if (!engine.rootless) return { rootless: false };
    const image = await this.inspectImage(effectiveImage);
    const user =
      runAs.trim() ||
      (identityImage === effectiveImage
        ? image.user
        : (await this.inspectImage(identityImage)).user);
    return { ...this.identityForUser(user, engine), imageId: image.id };
  }

  private identityForUser(
    user: string,
    engine: NonNullable<DockerFileOwnershipService["engine"]>
  ): DockerFileIdentity {
    const ownership = resolveRootlessFileOwnership(user, engine.runtime!, engine.namespace!);
    return { rootless: true, ownership, user, resourceLimits: engine.resourceLimits };
  }

  private async inspectImage(image: string): Promise<ImageIdentity> {
    const pending = this.imageRequests.get(image);
    if (pending) return pending;
    if (!image || this.imageRequests.size >= MAX_IMAGE_REQUESTS)
      throw new Error($t("TXT_CODE_rootless.imageUnavailable"));
    // Coalesce concurrent reads, but never cache USER by a mutable image tag.
    const request = (async () => {
      try {
        const info = await this.docker.getImage(image).inspect();
        if (
          !/^sha256:[a-f0-9]{64}$/.test(info.Id) ||
          (info.Config?.User != null && typeof info.Config.User !== "string")
        )
          throw unsupported();
        return { id: info.Id, user: info.Config?.User?.trim() || "0:0" };
      } catch {
        throw new Error($t("TXT_CODE_rootless.imageUnavailable"));
      }
    })();
    this.imageRequests.set(image, request);
    try {
      return await request;
    } finally {
      this.imageRequests.delete(image);
    }
  }
}

async function readRootlessEngineNamespace(
  docker: Pick<Docker, "getContainer">
): Promise<NamespaceMaps> {
  // This is deployment configuration, never an instance-controlled value.
  const containerName = process.env.MCSM_ROOTLESS_DOCKER_CONTAINER;
  if (!containerName || !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(containerName)) {
    throw unsupported();
  }
  const container = docker.getContainer(containerName);
  if (process.getuid!() !== 0) {
    const info = await container.inspect();
    const pid = info.State.Pid;
    if (!info.State.Running || !Number.isSafeInteger(pid) || pid <= 0) throw unsupported();
    // A host Daemon can inspect the local container's kernel mapping directly.
    return {
      uidMap: await fs.readFile(`/proc/${pid}/uid_map`, "utf8"),
      gidMap: await fs.readFile(`/proc/${pid}/gid_map`, "utf8")
    };
  }
  const command = await container.exec({
    Cmd: [
      process.execPath,
      "-e",
      'const fs = require("fs"); process.stdout.write(JSON.stringify({uidMap: fs.readFileSync("/proc/self/uid_map", "utf8"), gidMap: fs.readFileSync("/proc/self/gid_map", "utf8")}));'
    ],
    User: "0:0",
    AttachStdout: true,
    AttachStderr: true,
    Tty: true
  });
  const stream = await command.start({ Tty: true });
  const chunks: Buffer[] = [];
  let length = 0;
  const timer = setTimeout(() => stream.destroy(unsupported()), 5000);
  try {
    for await (const chunk of stream) {
      length += chunk.length;
      if (length > 32768) throw unsupported();
      chunks.push(Buffer.from(chunk));
    }
    const result = await command.inspect();
    if (result.Running || result.ExitCode !== 0) throw unsupported();
    const maps: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (
      !maps ||
      typeof maps !== "object" ||
      !("uidMap" in maps) ||
      !("gidMap" in maps) ||
      typeof maps.uidMap !== "string" ||
      typeof maps.gidMap !== "string"
    ) {
      throw unsupported();
    }
    return { uidMap: maps.uidMap, gidMap: maps.gidMap };
  } finally {
    clearTimeout(timer);
    stream.destroy();
  }
}

async function readDockerOwnershipRuntime(socketPath: string): Promise<DockerOwnershipRuntime> {
  const socket = await fs.stat(socketPath);
  if (!socket.isSocket()) throw unsupported();
  return {
    uid: process.getuid!(),
    gid: process.getgid!(),
    socketUid: socket.uid,
    socketGid: socket.gid,
    uidMap: await fs.readFile("/proc/self/uid_map", "utf8"),
    gidMap: await fs.readFile("/proc/self/gid_map", "utf8")
  };
}

export const dockerFileOwnership = new DockerFileOwnershipService();
