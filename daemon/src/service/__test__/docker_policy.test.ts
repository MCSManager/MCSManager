/**
 * DOCKER CONFIGURATION POLICY — attack suite
 * =========================================
 *
 * ATTACKER PROFILE: a compromised panel, or a second client that holds the daemon
 * API key. TARGET: the daemon host (MCSManager daemons usually run as root).
 *
 * Every test documents one attack and PASSES when the attack is BLOCKED.
 * Legitimate game-server configurations are included as regression tests: the
 * policy must not break normal usage (image, ports, memory, env, a volume under
 * the instance directory, ...).
 *
 * The last describe() drives the real `Instance.parameters()` setter, which is the
 * single funnel for both "instance create" and "instance update" in the daemon.
 */
import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

// Instance.parameters() is exercised below. Mock the modules whose import has
// side effects (a real JavaManager creates daemon/data/JavaData, the real
// dispatcher pulls the whole command/service graph) — the policy itself needs
// none of them.
vi.mock("../log", () => {
  const f: any = () => {};
  f.info = f;
  f.debug = f;
  f.warn = f;
  f.error = f;
  return { default: f };
});

vi.mock("../java_manager", () => ({
  default: { getJavaRuntimeCommand: vi.fn(async () => "java") }
}));

vi.mock("../../entity/commands/dispatcher", () => ({
  default: class FunctionDispatcher {}
}));

vi.mock("../../entity/commands/task/openfrp", () => ({
  OpenFrp: class OpenFrp {}
}));

import Instance from "../../entity/instance/instance";
import InstanceConfig from "../../entity/instance/Instance_config";
import { globalConfiguration } from "../../entity/config";
import {
  DANGEROUS_CAPABILITIES,
  extractVolumeSource,
  isDockerControlSocketPath,
  normalizeCapability,
  assertDockerConfigAllowed
} from "../docker_policy";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let tempRoot = "";
/** Stands in for `<daemon cwd>/data` (StorageSubsystem.DATA_PATH). */
let dataPath = "";
/** Default instance workspace: `<daemon cwd>/data/InstanceData/<uuid>`. */
let instanceDir = "";
/** Custom instance workspace outside the daemon data directory. */
let customInstanceDir = "";

beforeAll(() => {
  tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mcsm-docker-policy-"));
  dataPath = path.join(tempRoot, "daemon", "data");
  instanceDir = path.join(dataPath, "InstanceData", "abcdef012345");
  customInstanceDir = path.join(tempRoot, "instances", "abcdef012345");
  fs.mkdirsSync(instanceDir);
  fs.mkdirsSync(customInstanceDir);
  // Targets for the daemon-data tests (real paths help the symlink check).
  fs.mkdirsSync(path.join(dataPath, "Config"));
  fs.writeFileSync(path.join(dataPath, "Config", "global.json"), '{"key":"secret"}');
  fs.mkdirsSync(path.join(dataPath, "InstanceData", "other999"));
});

afterAll(() => {
  if (tempRoot) fs.removeSync(tempRoot);
});

/** Build a policy call bound to the temp daemon data dir. */
function validate(docker: any, options: any = {}) {
  return () =>
    assertDockerConfigAllowed(docker, {
      runtimeDataPath: dataPath,
      workspacePath: instanceDir,
      ...options
    });
}

/** MCSManager volume entry: `<hostPath>|<containerPath>`. */
function vol(hostPath: string, containerPath = "/data"): string {
  return `${hostPath}|${containerPath}`;
}

/** Run the policy and return the Error it threw (fails the test if it did not). */
function captureError(docker: any, options: any = {}): Error {
  try {
    assertDockerConfigAllowed(docker, {
      runtimeDataPath: dataPath,
      workspacePath: instanceDir,
      ...options
    });
  } catch (error: any) {
    return error;
  }
  throw new Error("expected the Docker policy to reject the configuration");
}

// ================================================================
// Tier 2 — privileged
// ================================================================

describe("privileged containers", () => {
  it("blocks privileged: true by default (container gets all capabilities and host devices)", () => {
    expect(validate({ privileged: true })).toThrow();
  });

  it("blocks a truthy non-boolean privileged value (Boolean('false') is true in the setter)", () => {
    expect(validate({ privileged: "false" })).toThrow();
  });

  it("allows privileged: true when the operator opted in via allowDangerousDockerOptions", () => {
    expect(validate({ privileged: true }, { allowDangerousOptions: true })).not.toThrow();
  });

  it("still allows privileged: false / omitted", () => {
    expect(validate({ privileged: false })).not.toThrow();
    expect(validate({ image: "itzg/minecraft-server" })).not.toThrow();
  });
});

// ================================================================
// Tier 2 — dangerous capabilities
// ================================================================

describe("capAdd dangerous capabilities", () => {
  it.each([
    "ALL",
    "CAP_ALL",
    "SYS_ADMIN",
    "CAP_SYS_ADMIN",
    "sys_admin",
    " Sys_Admin ",
    "SYS_MODULE",
    "SYS_PTRACE",
    "SYS_RAWIO",
    "SYS_BOOT",
    "DAC_READ_SEARCH",
    "dac_read_search"
  ])("blocks capAdd %s (host-root capability)", (capability) => {
    expect(validate({ capAdd: [capability] })).toThrow();
  });

  it("blocks SYS_ADMIN hidden behind harmless-looking siblings", () => {
    expect(validate({ capAdd: ["CHOWN", "NET_BIND_SERVICE", "CAP_SYS_ADMIN"] })).toThrow();
  });

  it("blocks the whole documented dangerous list", () => {
    for (const capability of DANGEROUS_CAPABILITIES) {
      expect(validate({ capAdd: [capability] })).toThrow();
    }
  });

  it("allows harmless capabilities (game servers legitimately need a few)", () => {
    expect(validate({ capAdd: ["CHOWN", "NET_BIND_SERVICE", "cap_dac_override"] })).not.toThrow();
    expect(validate({ capAdd: [] })).not.toThrow();
    expect(validate({ capDrop: ["ALL"] })).not.toThrow();
  });

  it("allows dangerous capabilities when the operator opted in", () => {
    expect(
      validate({ capAdd: ["CAP_SYS_ADMIN"] }, { allowDangerousOptions: true })
    ).not.toThrow();
  });

  it("rejects a non-array capAdd instead of silently trusting it", () => {
    expect(validate({ capAdd: "SYS_ADMIN" })).toThrow();
  });
});

// ================================================================
// Tier 2 — network mode
// ================================================================

describe("Docker network mode", () => {
  it("blocks networkMode host (container shares the host network namespace)", () => {
    expect(validate({ networkMode: "host" })).toThrow();
  });

  it("blocks networkMode HOST (case variant of the host namespace)", () => {
    expect(validate({ networkMode: "HOST" })).toThrow();
  });

  it("blocks networkMode container:<id> (join another container's namespace)", () => {
    expect(validate({ networkMode: "container:abcdef" })).toThrow();
  });

  it("blocks a padded networkMode value", () => {
    expect(validate({ networkMode: " host " })).toThrow();
  });

  it("allows bridge, none, the default (empty) and user-defined networks", () => {
    expect(validate({ networkMode: "bridge" })).not.toThrow();
    expect(validate({ networkMode: "none" })).not.toThrow();
    expect(validate({ networkMode: "" })).not.toThrow();
    expect(validate({})).not.toThrow();
    expect(validate({ networkMode: "mcsmanager-mcnet" })).not.toThrow();
  });

  it("allows host mode when the operator opted in", () => {
    expect(validate({ networkMode: "host" }, { allowDangerousOptions: true })).not.toThrow();
  });
});

// ================================================================
// Tier 2 — host devices
// ================================================================

describe("host device passthrough", () => {
  it("blocks devices passthrough by default (host device nodes in the container)", () => {
    expect(validate({ devices: ["/dev/sda|/dev/sda|rwm"] })).toThrow();
  });

  it("allows an empty device list", () => {
    expect(validate({ devices: [] })).not.toThrow();
  });

  it("allows device passthrough when the operator opted in", () => {
    expect(
      validate({ devices: ["/dev/sda|/dev/sda|rwm"] }, { allowDangerousOptions: true })
    ).not.toThrow();
  });

  it("rejects a non-array devices value", () => {
    expect(validate({ devices: "/dev/sda" })).toThrow();
  });
});

// ================================================================
// Operator-facing messages (actionable even before translations land)
// ================================================================

describe("rejection messages", () => {
  it("names the opt-in config key and the global config file for privileged mode", () => {
    const error = captureError({ privileged: true });
    expect(error.message).toContain("allowDangerousDockerOptions");
    expect(error.message).toContain(path.join(dataPath, "Config", "global.json"));
  });

  it("names the opt-in config key and the global config file for host networking", () => {
    const error = captureError({ networkMode: "host" });
    expect(error.message).toContain("allowDangerousDockerOptions");
    expect(error.message).toContain(path.join(dataPath, "Config", "global.json"));
  });

  it("names the opt-in config key and the global config file for dangerous capabilities", () => {
    const error = captureError({ capAdd: ["CAP_SYS_ADMIN"] });
    expect(error.message).toContain("SYS_ADMIN");
    expect(error.message).toContain("allowDangerousDockerOptions");
    expect(error.message).toContain(path.join(dataPath, "Config", "global.json"));
  });

  it("names the rejected host path for a forbidden mount", () => {
    const error = captureError({ extraVolumes: [vol("/var/run/docker.sock")] });
    expect(error.message).toContain("/var/run/docker.sock");
  });
});

// ================================================================
// Tier 1 — container engine control socket (no opt-in can allow it)
// ================================================================

describe("container engine control socket mounts", () => {
  it.each([
    "/var/run/docker.sock",
    "/run/docker.sock",
    "/var/run/docker.sock/",
    "//var/run/docker.sock",
    "\\\\.\\pipe\\docker_engine",
    "//./pipe/docker_engine",
    "\\\\.\\pipe\\docker_engine_windows",
    "//./pipe/dockerDesktopLinuxEngine",
    "\\\\?\\pipe\\docker_engine"
  ])("blocks a bind mount of %s", (socketPath) => {
    expect(validate({ extraVolumes: [vol(socketPath)] })).toThrow();
  });

  it("blocks the socket mount even when allowDangerousDockerOptions is enabled", () => {
    expect(
      validate({ extraVolumes: [vol("/var/run/docker.sock")] }, { allowDangerousOptions: true })
    ).toThrow();
    expect(
      validate({ extraVolumes: [vol("//./pipe/docker_engine")] }, { allowDangerousOptions: true })
    ).toThrow();
  });

  it("blocks the socket as a Docker 'host:container' volume string too", () => {
    expect(validate({ extraVolumes: ["/var/run/docker.sock:/var/run/docker.sock"] })).toThrow();
  });

  it("blocks mounting the runtime directory that contains the socket (/var/run, /run)", () => {
    expect(validate({ extraVolumes: [vol("/var/run/")] })).toThrow();
    expect(validate({ extraVolumes: [vol("/run")] })).toThrow();
    expect(validate({ extraVolumes: [vol("/var/run/docker")] })).toThrow();
  });

  it("does not block unrelated named pipes (over-blocking control)", () => {
    expect(
      validate({ extraVolumes: [vol("\\\\.\\pipe\\some_other_pipe", "/pipe")] })
    ).not.toThrow();
  });

  it("detects every socket spelling through isDockerControlSocketPath", () => {
    expect(isDockerControlSocketPath("/var/run/docker.sock")).toBe(true);
    expect(isDockerControlSocketPath("//./pipe/docker_engine")).toBe(true);
    expect(isDockerControlSocketPath("\\\\.\\pipe\\docker_engine")).toBe(true);
    expect(isDockerControlSocketPath("/home/mc/server")).toBe(false);
    expect(isDockerControlSocketPath("")).toBe(false);
  });
});

// ================================================================
// Tier 1 — fatal host paths
// ================================================================

describe("fatal host paths", () => {
  it.each(["/", "/proc", "/sys", "/dev", "/boot", "/etc"])(
    "blocks a bind mount of %s",
    (hostPath) => {
      expect(validate({ extraVolumes: [vol(hostPath)] })).toThrow();
    }
  );

  it.each(["/proc/1", "/sys/kernel", "/dev/sda", "/boot/grub", "/etc/shadow", "/etc/ssh"])(
    "blocks the system subtree %s",
    (hostPath) => {
      expect(validate({ extraVolumes: [vol(hostPath)] })).toThrow();
    }
  );

  it.each(["C:\\", "c:\\", "C:/", "C:\\Windows", "c:/windows", "C:\\Windows\\System32"])(
    "blocks the Windows system path %s",
    (hostPath) => {
      expect(validate({ extraVolumes: [vol(hostPath)] })).toThrow();
    }
  );

  it("blocks the Windows system directory even with the dangerous-options opt-in", () => {
    expect(
      validate({ extraVolumes: [vol("C:\\Windows\\System32")] }, { allowDangerousOptions: true })
    ).toThrow();
  });

  it.each(["/etc/localtime", "/etc/timezone"])(
    "keeps the host timezone file %s mountable (common game-server setup)",
    (hostPath) => {
      expect(validate({ extraVolumes: [vol(hostPath, "/etc/localtime")] })).not.toThrow();
    }
  );

  it("keeps the timezone exception exact (no other /etc path is exempt)", () => {
    expect(validate({ extraVolumes: [vol("/etc/localtime/../shadow")] })).toThrow();
    expect(validate({ extraVolumes: [vol("/etc/localtimex")] })).toThrow();
    expect(validate({ extraVolumes: [vol("/etc")] })).toThrow();
  });

  it("allows an ordinary absolute host directory", () => {
    expect(validate({ extraVolumes: [vol("/home/mc/shared-mods", "/mods")] })).not.toThrow();
    expect(validate({ extraVolumes: [vol("D:\\mc\\shared-mods", "/mods")] })).not.toThrow();
  });
});

// ================================================================
// Tier 1 — the daemon runtime data directory (API key store)
// ================================================================

describe("daemon runtime directory mounts", () => {
  it("blocks the panel<->daemon API key store (data/Config/global.json)", () => {
    expect(
      validate({ extraVolumes: [vol(path.join(dataPath, "Config", "global.json"))] })
    ).toThrow();
  });

  it("blocks the whole data/Config directory", () => {
    expect(validate({ extraVolumes: [vol(path.join(dataPath, "Config"))] })).toThrow();
  });

  it("blocks the data root itself", () => {
    expect(validate({ extraVolumes: [vol(dataPath)] })).toThrow();
  });

  it("blocks other tenants' instance configs (they hold rcon passwords)", () => {
    expect(
      validate({ extraVolumes: [vol(path.join(dataPath, "InstanceConfig", "x.json"))] })
    ).toThrow();
  });

  it("blocks a sibling instance workspace inside data/InstanceData", () => {
    expect(
      validate({ extraVolumes: [vol(path.join(dataPath, "InstanceData", "other999", "world"))] })
    ).toThrow();
  });

  it("still allows the instance's own workspace under data/InstanceData", () => {
    expect(
      validate({ extraVolumes: [vol(path.join(instanceDir, "mods"), "/mods")] })
    ).not.toThrow();
  });

  it("still allows the documented {mcsm_workspace} variable for extra volumes", () => {
    expect(validate({ extraVolumes: [vol("{mcsm_workspace}/mods", "/mods")] })).not.toThrow();
  });

  it("allows an instance workspace outside the daemon data directory", () => {
    expect(
      validate(
        { extraVolumes: [vol(path.join(customInstanceDir, "mods"), "/mods")] },
        { workspacePath: customInstanceDir }
      )
    ).not.toThrow();
  });

  it("never exempts the global instance (cwd '/') from the data directory rule", () => {
    expect(
      validate(
        { extraVolumes: [vol(path.join(dataPath, "Config", "global.json"))] },
        { workspacePath: "/" }
      )
    ).toThrow();
  });
});

// ================================================================
// Tier 1 — volume source shape
// ================================================================

describe("volume source shape", () => {
  it.each([
    ["relative", "some/relative/dir"],
    ["dot-relative", "./data"],
    ["parent only", ".."],
    ["parent prefix", "../etc"],
    ["nested traversal", "/home/mc/../../etc"],
    ["windows traversal", "C:\\data\\..\\Windows"]
  ])("blocks a %s volume source", (_label, hostPath) => {
    expect(validate({ extraVolumes: [vol(hostPath)] })).toThrow();
  });

  it("blocks an empty host part", () => {
    expect(validate({ extraVolumes: ["|/data"] })).toThrow();
    expect(validate({ extraVolumes: [""] })).toThrow();
    expect(validate({ extraVolumes: ["   "] })).toThrow();
  });

  it("blocks the placeholders whose expansion can contain path separators", () => {
    // {mcsm_instance_name} is the instance nickname: a nickname such as "../../.."
    // would turn a validated literal into an unvalidated path at container start.
    expect(validate({ extraVolumes: [vol("/safe/{mcsm_instance_name}", "/x")] })).toThrow();
    expect(validate({ extraVolumes: [vol("{mcsm_instance_name}/x", "/x")] })).toThrow();
    // {mcsm_run_as} is a user name, {mcsm_java}/{mcsm_steamcmd} are command paths.
    expect(validate({ extraVolumes: [vol("/safe/{mcsm_run_as}", "/x")] })).toThrow();
    expect(validate({ extraVolumes: [vol("/safe/{mcsm_java}", "/x")] })).toThrow();
    expect(validate({ extraVolumes: [vol("/safe/{mcsm_steamcmd}", "/x")] })).toThrow();
  });

  it("blocks an unknown {mcsm_*} variable instead of trusting the expanded value", () => {
    expect(validate({ extraVolumes: [vol("/safe/{mcsm_unknown_thing}", "/x")] })).toThrow();
  });

  it("accepts every value-safe variable (one opaque path segment)", () => {
    for (const token of [
      "{mcsm_uuid}",
      "{mcsm_random}",
      "{mcsm_instance_id}",
      "{mcsm_instance_base_port}",
      "{mcsm_port1}",
      "{mcsm_port12}"
    ]) {
      expect(validate({ extraVolumes: [`/srv/mcsm/${token}|/instance`] })).not.toThrow();
    }
  });

  it("accepts {mcsm_cwd} like {mcsm_workspace} (both expand to the instance directory)", () => {
    expect(validate({ extraVolumes: [vol("{mcsm_cwd}/mods", "/mods")] })).not.toThrow();
  });

  it("accepts the documented {mcsm_instance_id} variable", () => {
    expect(validate({ extraVolumes: ["/srv/mcsm/{mcsm_instance_id}|/instance"] })).not.toThrow();
  });

  it("rejects malformed entries and non-array extraVolumes", () => {
    expect(validate({ extraVolumes: "not-an-array" })).toThrow();
    expect(validate({ extraVolumes: [42 as any] })).toThrow();
  });
});

// ================================================================
// Volume syntax — only the host part is validated
// ================================================================

describe("volume syntax (only the host part is validated)", () => {
  it("parses MCSManager 'host|container' entries", () => {
    expect(extractVolumeSource("/host/dir|/container/dir")).toBe("/host/dir");
    expect(extractVolumeSource("C:\\host\\dir|C:\\container")).toBe("C:\\host\\dir");
    expect(extractVolumeSource("{mcsm_workspace}/mods|/mods")).toBe("{mcsm_workspace}/mods");
  });

  it("parses Docker 'host:container[:mode]' entries without eating the drive letter", () => {
    expect(extractVolumeSource("/host/dir:/container/dir")).toBe("/host/dir");
    expect(extractVolumeSource("/host/dir:/container/dir:ro")).toBe("/host/dir");
    expect(extractVolumeSource("C:\\host\\dir:/container/dir")).toBe("C:\\host\\dir");
  });

  it("returns undefined when there is no host part", () => {
    expect(extractVolumeSource("|/container")).toBeUndefined();
    expect(extractVolumeSource("")).toBeUndefined();
    expect(extractVolumeSource("   ")).toBeUndefined();
  });

  it("accepts a container target that looks dangerous (it is not a host path)", () => {
    expect(validate({ extraVolumes: [vol("/home/mc/plugins", "/home/mc/plugins")] })).not.toThrow();
  });
});

// ================================================================
// Windows / POSIX path forms
// ================================================================

describe("Windows and POSIX path forms", () => {
  it("rejects a bare drive specifier or root-relative Windows path", () => {
    expect(validate({ extraVolumes: [vol("C:")] })).toThrow();
    expect(validate({ extraVolumes: [vol("\\Windows")] })).toThrow();
  });

  it("accepts a UNC share as an absolute Windows path", () => {
    expect(validate({ extraVolumes: [vol("\\\\server\\share\\mc\\mods", "/mods")] })).not.toThrow();
  });

  it("accepts a backslash-only absolute Windows path", () => {
    expect(validate({ extraVolumes: [vol("D:\\mc\\mods", "/mods")] })).not.toThrow();
  });

  it("is case-insensitive for the Windows system directory", () => {
    expect(validate({ extraVolumes: [vol("c:\\wInDoWs\\temp", "/x")] })).toThrow();
  });

  it("does not treat POSIX paths as Windows paths (and vice versa)", () => {
    expect(validate({ extraVolumes: [vol("/home/mc/mods", "/mods")] })).not.toThrow();
    expect(validate({ extraVolumes: [vol("C:\\mc\\mods", "/mods")] })).not.toThrow();
    expect(validate({ extraVolumes: [vol("/etc", "/etc")] })).toThrow();
    expect(validate({ extraVolumes: [vol("C:\\Windows", "/windows")] })).toThrow();
  });
});

// ================================================================
// Regression — a normal game-server configuration must keep working
// ================================================================

describe("normal game-server configuration (must NOT be blocked)", () => {
  const normalConfig = () => ({
    updateCommandImage: "HOST",
    containerName: "MCSM-mcserver",
    image: "itzg/minecraft-server:java21",
    memory: 4096,
    memorySwap: 0,
    memorySwappiness: 60,
    cpuUsage: 200,
    cpusetCpus: "0,1",
    ports: ["25565:25565/tcp", "24454:24454/udp"],
    extraVolumes: [`${path.join(instanceDir, "mods")}|/data/mods`],
    networkMode: "bridge",
    networkAliases: ["mcserver"],
    workingDir: "/data",
    changeWorkdir: true,
    env: ["EULA=TRUE", "MEMORY=4G"],
    labels: ["com.example.server=mc"],
    uploadSpeedLimit: 0,
    downloadSpeedLimit: 0,
    capAdd: ["CHOWN"],
    capDrop: ["MKNOD"],
    privileged: false,
    devices: [],
    gpuEnabled: false,
    gpuCount: -1,
    gpuDeviceIds: [],
    gpuDriver: "nvidia",
    deviceReadBps: ["/dev/sda:10MB"],
    deviceWriteBps: []
  });

  it("is accepted unchanged and is not mutated by the policy", () => {
    const config = normalConfig();
    const snapshot = JSON.parse(JSON.stringify(config));
    expect(validate(config)).not.toThrow();
    expect(config).toEqual(snapshot);
  });

  it("is accepted unchanged when the dangerous options are explicitly disabled", () => {
    const config = normalConfig();
    expect(validate(config, { allowDangerousOptions: false })).not.toThrow();
  });

  it("accepts an empty / missing docker configuration (non-Docker instances)", () => {
    expect(validate(undefined)).not.toThrow();
    expect(validate(null)).not.toThrow();
    expect(validate({})).not.toThrow();
    expect(validate({ extraVolumes: [] })).not.toThrow();
  });

  it("does not mutate a rejected configuration either", () => {
    const config = {
      image: "alpine",
      privileged: true,
      extraVolumes: ["/var/run/docker.sock|/docker.sock"]
    };
    const snapshot = JSON.parse(JSON.stringify(config));
    expect(validate(config)).toThrow();
    expect(config).toEqual(snapshot);
  });

  it("defaults the protected data directory to StorageSubsystem.DATA_PATH", () => {
    // Without an explicit runtimeDataPath the daemon's own data dir is protected.
    const daemonData = path.join(process.cwd(), "data", "Config", "global.json");
    expect(() =>
      assertDockerConfigAllowed({ extraVolumes: [vol(daemonData)] })
    ).toThrow();
  });
});

// ================================================================
// Wiring — Instance.parameters() (the single funnel for create + update)
// ================================================================

describe("wiring: Instance.parameters() enforces the policy", () => {
  function newInstance() {
    const config = new InstanceConfig();
    config.cwd = customInstanceDir;
    return new Instance("abcdef0123456789", config);
  }

  afterEach(() => {
    globalConfiguration.config.allowDangerousDockerOptions = false;
  });

  it("rejects privileged: true on the create/update path with an actionable message", () => {
    const instance = newInstance();
    expect(() => instance.parameters({ docker: { privileged: true } }, false)).toThrow(
      /allowDangerousDockerOptions/
    );
    expect(instance.config.docker.privileged).toBe(false);
  });

  it("rejects before applying anything else (no partial state)", () => {
    const instance = newInstance();
    expect(() =>
      instance.parameters({ nickname: "pwned", docker: { privileged: true } }, false)
    ).toThrow();
    expect(instance.config.nickname).toBe("Undefined");
  });

  it("rejects a docker.sock mount on the create/update path even with the opt-in", () => {
    globalConfiguration.config.allowDangerousDockerOptions = true;
    const instance = newInstance();
    expect(() =>
      instance.parameters({ docker: { extraVolumes: [vol("/var/run/docker.sock")] } }, false)
    ).toThrow();
    expect(instance.config.docker.extraVolumes).toEqual([]);
  });

  it("applies dangerous options when the daemon global switch is enabled", () => {
    globalConfiguration.config.allowDangerousDockerOptions = true;
    const instance = newInstance();
    expect(() =>
      instance.parameters(
        { docker: { privileged: true, capAdd: ["SYS_ADMIN"], networkMode: "host" } },
        false
      )
    ).not.toThrow();
    expect(instance.config.docker.privileged).toBe(true);
    expect(instance.config.docker.capAdd).toEqual(["SYS_ADMIN"]);
    expect(instance.config.docker.networkMode).toBe("host");
  });

  it("fails closed for a config saved before this policy existed (start barrier)", () => {
    // StorageSubsystem.load() hands the daemon exactly this: a config persisted by
    // an older daemon, possibly with dangerous options already saved. The instance
    // keeps the config, but SetupDockerContainer.onStart() re-runs this validation
    // before creating the container, so the instance cannot start.
    const instance = newInstance();
    instance.config.docker = {
      ...instance.config.docker,
      image: "itzg/minecraft-server",
      privileged: true,
      networkMode: "host"
    };

    const error = captureError(instance.config.docker, {
      runtimeDataPath: dataPath,
      workspacePath: customInstanceDir
    });
    expect(error.message).toContain("allowDangerousDockerOptions");
    expect(error.message).toContain(path.join(dataPath, "Config", "global.json"));

    // The operator's two ways out: enable the switch, or remove the option.
    expect(
      validate(instance.config.docker, {
        allowDangerousOptions: true,
        workspacePath: customInstanceDir
      })
    ).not.toThrow();
  });

  it("applies a normal game-server configuration unchanged", () => {
    const instance = newInstance();
    expect(() =>
      instance.parameters(
        {
          docker: {
            image: "itzg/minecraft-server",
            ports: ["25565:25565/tcp"],
            memory: 4096,
            env: ["EULA=TRUE"],
            networkMode: "bridge",
            extraVolumes: [vol("{mcsm_workspace}/mods", "/data/mods")]
          }
        },
        false
      )
    ).not.toThrow();
    expect(instance.config.docker.image).toBe("itzg/minecraft-server");
    expect(instance.config.docker.ports).toEqual(["25565:25565/tcp"]);
    expect(instance.config.docker.memory).toBe(4096);
    expect(instance.config.docker.env).toEqual(["EULA=TRUE"]);
    expect(instance.config.docker.networkMode).toBe("bridge");
    expect(instance.config.docker.extraVolumes).toEqual([
      vol("{mcsm_workspace}/mods", "/data/mods")
    ]);
  });
});

// ================================================================
// Helper normalisation (documented behaviour used by the rules)
// ================================================================

describe("capability normalisation", () => {
  it("accepts both the SYS_ADMIN and CAP_SYS_ADMIN spellings", () => {
    expect(normalizeCapability("SYS_ADMIN")).toBe("SYS_ADMIN");
    expect(normalizeCapability("CAP_SYS_ADMIN")).toBe("SYS_ADMIN");
    expect(normalizeCapability(" cap_sys_admin ")).toBe("SYS_ADMIN");
    expect(normalizeCapability("ALL")).toBe("ALL");
    expect(normalizeCapability("CAP_ALL")).toBe("ALL");
  });
});
