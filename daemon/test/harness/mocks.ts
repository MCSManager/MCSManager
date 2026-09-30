import { vi } from "vitest";

/**
 * Daemon test mock factories. Each batch `vi.mock(path, () => factory(args))` pulls from here.
 * The factories are intentionally minimal: they expose the surface a router reads, as vi.fn()
 * spies, so tests assert call args while boundary I/O (disk / docker / network / binaries /
 * timers / PTY) is avoided.
 */

export function mockGlobalConfig(overrides: Record<string, any> = {}) {
  return {
    globalConfiguration: {
      config: {
        key: "test-key",
        whiteListPanelIp: false,
        whiteListPanelIps: ["127.0.0.1"],
        prefix: "",
        language: "en_us",
        version: 2,
        defaultInstancePath: "",
        updateSourceUrl: "",
        ...overrides
      },
      store: vi.fn()
    },
    globalEnv: { fileTaskCount: 0 },
    Config: class {}
  };
}

export function fakeInstance(uuid: string, overrides: Record<string, any> = {}) {
  return {
    instanceUuid: uuid,
    config: { extraConfig: {}, nickName: uuid, startCommand: "", stopCommand: "", type: "universal", processType: "general", ...overrides.config },
    info: { maxSpace: 0, cacheSize: 0, playerName: [], ...overrides.info },
    startCount: 0,
    status: vi.fn(() => 0),
    execPreset: vi.fn(async () => undefined),
    forceExec: vi.fn(async () => undefined),
    parameters: vi.fn((cfg) => cfg),
    absoluteCwdPath: vi.fn(() => `/tmp/inst-${uuid}`),
    parseTextParams: vi.fn((t) => t),
    started: vi.fn(),
    stopped: vi.fn(),
    ...overrides
  };
}

export function mockInstanceSystem(instances: any[] = []) {
  const map = new Map(instances.map((i) => [i.instanceUuid, i]));
  return {
    default: {
      instances: map,
      instanceStream: {
        requestForward: vi.fn(),
        cannelForward: vi.fn(),
        forward: vi.fn(),
        forwardViaCallback: vi.fn(),
        hasListenInstance: vi.fn(() => false),
        stopForward: vi.fn()
      },
      getInstance: vi.fn((uuid: string) => map.get(uuid)),
      getInstances: vi.fn(() => Array.from(map.values())),
      createInstance: vi.fn(async (cfg: any) => ({ ...fakeInstance("new"), ...cfg })),
      removeInstance: vi.fn(),
      exists: vi.fn((uuid: string) => map.has(uuid)),
      getQueryMapWrapper: vi.fn(() => ({ data: [] })),
      forEachForward: vi.fn(),
      exit: vi.fn(),
      softExit: vi.fn(),
      on: vi.fn(),
      emit: vi.fn(),
      once: vi.fn()
    }
  };
}

// dockerode-shaped stub via DockerManager. Batch tasks extend per-event.
export function mockDocker(overrides: Record<string, any> = {}) {
  const image = { remove: vi.fn(async () => undefined) };
  return {
    default: {
      getDocker: vi.fn(() => ({
        listImages: vi.fn(async () => [{ Id: "img-1", RepoTags: ["a:latest"] }]),
        listContainers: vi.fn(async () => [{ Id: "c-1", Names: ["c1"] }]),
        listNetworks: vi.fn(async () => [{ Name: "bridge" }]),
        getImage: vi.fn(() => image),
        buildImage: vi.fn(async () => undefined),
        ...overrides
      })),
      getSupportedPlatforms: vi.fn(async () => []),
      getImagePlatforms: vi.fn(async () => []),
      builderProgress: new Map(),
      startBuildImage: vi.fn(async () => undefined)
    }
  };
}

export function mockMissionPassport(existing: Record<string, any> = {}) {
  const missions = new Map(Object.entries(existing));
  return {
    missionPassport: {
      missions,
      registerMission: vi.fn((pw: string, m: any) => missions.set(pw, m)),
      getMission: vi.fn((pw: string, name: string) => {
        const m = missions.get(pw);
        return m && m.name === name ? m : null;
      }),
      deleteMission: vi.fn((pw: string) => {
        const m = missions.get(pw);
        if (m) m.isDeleted = true;
      })
    },
    LOGIN_BY_TOP_LEVEL: "TOP_LEVEL",
    LOGIN_FROM_STREAM: "STREAM",
    loginSuccessful: vi.fn((ctx: any, key: string) => {
      ctx.session.key = key;
      ctx.session.login = true;
      ctx.session.id = ctx.socket.id;
      ctx.session.type = "TOP_LEVEL";
      ctx.session.stream = {};
      return ctx.session;
    }),
    streamLoginSuccessful: vi.fn((ctx: any, instanceUuid: string) => {
      ctx.session.id = ctx.socket.id;
      ctx.session.login = true;
      ctx.session.type = "STREAM";
      ctx.session.stream = { check: true, instanceUuid };
      return ctx.session;
    })
  };
}
