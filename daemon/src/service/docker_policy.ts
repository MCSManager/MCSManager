/**
 * Docker configuration policy (daemon side).
 *
 * The daemon receives every instance Docker setting from the panel — or from any
 * other client that holds the daemon API key — so those values must never be
 * trusted as-is. Without a policy a compromised panel can ask Docker for a
 * container that bind-mounts /var/run/docker.sock, runs `privileged`, adds
 * SYS_ADMIN or joins the host network, which is one step away from host root and
 * breaks the multi-tenant isolation this project promises.
 *
 * Two tiers:
 *  1. ALWAYS rejected (no opt-in can allow it): container-engine control sockets,
 *     the daemon runtime data directory (the panel<->daemon API key store), fatal
 *     host roots (/proc, /sys, /etc, ... — only the host timezone files are
 *     exempt), and volume sources that are relative, empty or traverse upwards
 *     with "..".
 *  2. Rejected unless `allowDangerousDockerOptions` is enabled in the daemon global
 *     config (`daemon/data/Config/global.json`): privileged mode, dangerous
 *     capabilities, "host"/"container:*" network mode and host device passthrough.
 *
 * Everything else (image, ports, memory, cpu limits, env, labels, workingDir,
 * network aliases, speed limits, GPU options, ...) is left untouched so normal
 * game-server usage keeps working exactly as before.
 *
 * Enforced twice:
 *  - `Instance.parameters()` (the single funnel for instance create and update)
 *    validates the incoming values before anything is applied;
 *  - `SetupDockerContainer.onStart()` re-validates the persisted configuration
 *    right before a container is created, so a configuration saved by an older
 *    daemon (or before this policy existed) is never honored.
 *
 * FAIL-CLOSED UPGRADE IMPACT: an existing instance whose saved configuration
 * already contains a tier-2 value (for example `privileged: true`, `networkMode:
 * "host"`, `capAdd: ["SYS_ADMIN"]` or a `devices` entry) keeps its saved config,
 * but the daemon now refuses to start it and refuses further configuration
 * updates until the operator either enables `allowDangerousDockerOptions` in
 * `daemon/data/Config/global.json` or removes the option. The thrown message
 * names that config key and file so the operator can act on it.
 */
import fs from "fs-extra";
import { StorageSubsystem } from "mcsmanager-common";
import path from "path";
import { $t } from "../i18n";

/** Capabilities that effectively grant host root. Normalised (no CAP_ prefix). */
export const DANGEROUS_CAPABILITIES: readonly string[] = [
  "ALL",
  "DAC_READ_SEARCH",
  "SYS_ADMIN",
  "SYS_BOOT",
  "SYS_MODULE",
  "SYS_PTRACE",
  "SYS_RAWIO"
];

/**
 * Host directories that must never be bind-mounted (the whole subtree). The last
 * two hold the container-engine control socket.
 */
export const FORBIDDEN_HOST_DIRECTORIES: readonly string[] = [
  "/proc",
  "/sys",
  "/dev",
  "/boot",
  "/etc",
  "/run",
  "/var/run"
];

/**
 * Individual host files that stay mountable even though they live in a forbidden
 * subtree: mounting the host timezone into a game-server container is a common,
 * benign setup, so these exact paths are exempt.
 */
export const ALLOWED_HOST_FILES: readonly string[] = ["/etc/localtime", "/etc/timezone"];

/** Container-engine control sockets — mounting one of these is host root. */
export const FORBIDDEN_ENGINE_SOCKET_PATHS: readonly string[] = [
  "/var/run/docker.sock",
  "/run/docker.sock"
];

/** Global config key that turns tier-2 rejections into a deliberate opt-in. */
export const DANGEROUS_OPTIONS_KEY = "allowDangerousDockerOptions";

export interface IDockerPolicyOptions {
  /** Value of `globalConfiguration.config.allowDangerousDockerOptions`. */
  allowDangerousOptions?: boolean;
  /** Absolute daemon runtime directory (default: `StorageSubsystem.DATA_PATH`). */
  runtimeDataPath?: string;
  /** Absolute working directory of the instance that owns the configuration. */
  workspacePath?: string;
}

interface IDockerPolicyContext {
  allowDangerousOptions: boolean;
  /** Every known spelling (plain + symlink-resolved) of `<daemon cwd>/data`. */
  dataPaths: string[];
  /** Every known spelling (plain + symlink-resolved) of the instance workspace. */
  workspacePaths: string[];
}

interface IPolicyMessage {
  key: string;
  /** English fallback, used until the key exists in `languages/*.json`. */
  text: string;
}

/**
 * Stable message keys. `text` is only a fallback for a language pack that does not
 * contain the key yet; once the translations land, the localised string is shown.
 */
const POLICY_MESSAGES = {
  socket: {
    key: "TXT_CODE_docker.dockerSocketBlocked",
    text: 'Mounting the container engine control socket is not allowed: "{{path}}"'
  },
  forbiddenPath: {
    key: "TXT_CODE_docker.forbiddenHostPath",
    text: 'Mounting this host path is not allowed: "{{path}}"'
  },
  daemonData: {
    key: "TXT_CODE_docker.daemonDataMountBlocked",
    text: 'Mounting a path inside the daemon data directory is not allowed: "{{path}}"'
  },
  emptySource: {
    key: "TXT_CODE_docker.volumeSourceEmpty",
    text: "Docker volume source must not be empty."
  },
  traversal: {
    key: "TXT_CODE_docker.volumeSourceTraversal",
    text: 'Docker volume source must not contain "..": "{{path}}"'
  },
  notAbsolute: {
    key: "TXT_CODE_docker.volumeSourceNotAbsolute",
    text: 'Docker volume source must be an absolute host path: "{{path}}"'
  },
  placeholder: {
    key: "TXT_CODE_docker.volumeSourcePlaceholder",
    text: 'Docker volume source uses the unsupported variable "{{token}}": "{{path}}"'
  },
  volumeEntry: {
    key: "TXT_CODE_docker.volumeEntryInvalid",
    text: 'Invalid Docker volume entry "{{entry}}", expected "hostPath|containerPath"'
  },
  optionInvalid: {
    key: "TXT_CODE_docker.optionInvalid",
    text: 'Invalid Docker configuration option "{{key}}", expected {{expected}}'
  },
  privileged: {
    key: "TXT_CODE_docker.privilegedBlocked",
    text:
      'Privileged containers are disabled on this daemon. Set "{{key}}" to true in ' +
      "{{path}} to allow them, or remove the option from the instance configuration."
  },
  capability: {
    key: "TXT_CODE_docker.capAddBlocked",
    text:
      'Adding the Docker capability "{{cap}}" is disabled on this daemon. Set "{{key}}" to true in ' +
      "{{path}} to allow it, or remove it from the instance configuration."
  },
  networkMode: {
    key: "TXT_CODE_docker.networkModeBlocked",
    text:
      'Docker network mode "{{mode}}" is disabled on this daemon. Set "{{key}}" to true in ' +
      "{{path}} to allow it, or remove it from the instance configuration."
  },
  devices: {
    key: "TXT_CODE_docker.devicesBlocked",
    text:
      "Passing host devices into a container is disabled on this daemon. Set " +
      '"{{key}}" to true in {{path}} to allow it, or remove the devices from the instance configuration.'
  }
} as const;

function policyError(message: IPolicyMessage, params: Record<string, unknown> = {}): Error {
  const text = $t(message.key, { ...params, defaultValue: message.text });
  return new Error(String(text));
}

// ---------------------------------------------------------------------------
// Path helpers (Windows and POSIX forms are handled explicitly)
// ---------------------------------------------------------------------------

function isWindowsFlavoredPath(source: string): boolean {
  return /^[a-zA-Z]:/.test(source) || source.startsWith("\\\\");
}

function normalizeHostPath(source: string): string {
  const raw = String(source ?? "");
  if (!raw) return "";
  if (isWindowsFlavoredPath(raw)) return path.win32.normalize(raw);
  // POSIX permits a leading "//"; collapse it so comparisons are unambiguous.
  return path.posix.normalize(raw.replace(/\/{2,}/g, "/"));
}

function isAbsoluteHostPath(source: string): boolean {
  if (isWindowsFlavoredPath(source)) {
    // Drive-absolute (C:\...) or a UNC share (\\server\share). A bare "C:" or a
    // root-relative "\Windows" is not a complete host path.
    return /^[a-zA-Z]:[\\/]/.test(source) || /^\\\\[^\\/]/.test(source);
  }
  return source.startsWith("/");
}

function hasParentTraversal(source: string): boolean {
  return /(^|[\\/])\.\.([\\/]|$)/.test(source);
}

function isSameOrInside(target: string, root: string, windows: boolean): boolean {
  const sep = windows ? "\\" : "/";
  const normalizedTarget = windows ? target.toLowerCase() : target;
  const normalizedRoot = windows ? root.toLowerCase() : root;
  if (normalizedTarget === normalizedRoot) return true;
  if (normalizedRoot === sep) return normalizedTarget.startsWith(sep);
  const prefix = normalizedRoot.endsWith(sep) ? normalizedRoot : normalizedRoot + sep;
  return normalizedTarget.startsWith(prefix);
}

function tryRealPath(target: string): string | undefined {
  try {
    // UNC / device paths may touch the network (or block) on a stat call, and never
    // need symlink resolution, so they are left to the lexical checks.
    if (/^[\\/]{2}/.test(target)) return undefined;
    if (!fs.existsSync(target)) return undefined;
    return fs.realpathSync(target);
  } catch {
    // Not readable / not a link / unsupported on this platform: lexical checks stand.
    return undefined;
  }
}

/**
 * All spellings of a host path that the policy has to compare against: the plain
 * normalised form and, when the path exists, its symlink-resolved form. Docker
 * resolves the source on the host, so both can reach the same file.
 */
function hostPathVariants(source: string | undefined): string[] {
  if (!source) return [];
  const normalized = normalizeHostPath(source);
  if (!normalized) return [];
  const realPath = tryRealPath(normalized);
  const canonical = realPath ? normalizeHostPath(realPath) : normalized;
  if (!canonical || canonical === normalized) return [normalized];
  return [normalized, canonical];
}

/** The global config file the operator must edit to opt in to dangerous options. */
function daemonConfigFilePath(context: IDockerPolicyContext): string {
  const dataRoot = context.dataPaths[0] || path.join(process.cwd(), "data");
  return path.join(dataRoot, "Config", "global.json");
}

/**
 * True when the value points at a container-engine control socket (Docker or the
 * Docker-compatible engines), in any POSIX path or Windows named-pipe spelling.
 * Symlinked spellings (/var/run -> /run) are covered by listing both paths.
 */
export function isDockerControlSocketPath(source: string): boolean {
  const raw = String(source ?? "").trim();
  if (!raw) return false;

  // Windows named pipes: \\.\pipe\docker_engine, //./pipe/docker_engine,
  // \\?\pipe\..., including Docker Desktop's dockerDesktop*Engine aliases.
  const pipePath = raw.replace(/\//g, "\\").toLowerCase();
  const pipeMatch = /^\\\\[?.]\\pipe(\\|$)/.exec(pipePath);
  if (pipeMatch) {
    const pipeName = pipePath.slice(pipeMatch[0].length);
    return !pipeName || pipeName.includes("docker") || pipeName.includes("podman");
  }

  if (raw.startsWith("/")) {
    const posixPath = path.posix.normalize(raw.replace(/\/{2,}/g, "/")).toLowerCase();
    return FORBIDDEN_ENGINE_SOCKET_PATHS.includes(posixPath);
  }
  return false;
}

function isForbiddenHostPath(normalized: string, windows: boolean): boolean {
  // The timezone files of a forbidden subtree stay mountable (exact path only).
  if (ALLOWED_HOST_FILES.includes(normalized)) return false;

  if (windows) {
    // Any drive root (C:\, D:\) or anything inside the Windows system directory.
    if (/^[a-zA-Z]:\\?$/.test(normalized)) return true;
    return /^[a-zA-Z]:\\windows(\\|$)/i.test(normalized);
  }
  if (normalized === "/") return true;
  return FORBIDDEN_HOST_DIRECTORIES.some(
    (directory) => normalized === directory || normalized.startsWith(directory + "/")
  );
}

// ---------------------------------------------------------------------------
// Volume / path entry parsing
// ---------------------------------------------------------------------------

/**
 * Extract the *host* part of a volume entry. MCSManager stores extra volumes as
 * "host|container"; Docker's own "host:container[:mode]" syntax is accepted too.
 * A Windows drive letter ("C:\data") is part of the host path, never a separator.
 * Returns undefined when the entry has no host part at all (e.g. "|/data").
 */
export function extractVolumeSource(entry: string): string | undefined {
  const text = String(entry ?? "").trim();
  if (!text) return undefined;

  const pipeIndex = text.indexOf("|");
  if (pipeIndex >= 0) return text.slice(0, pipeIndex).trim() || undefined;

  const colonIndex = /^[a-zA-Z]:/.test(text) ? text.indexOf(":", 2) : text.indexOf(":");
  if (colonIndex >= 0) return text.slice(0, colonIndex).trim() || undefined;
  return text;
}

// Placeholders expanded by Instance.parseTextParams(). {mcsm_instance_name},
// {mcsm_run_as}, {mcsm_java} and {mcsm_steamcmd} can expand to something that
// contains path separators or shell fragments, so they are rejected instead of
// being trusted after expansion.
const UNSAFE_VOLUME_PLACEHOLDER = /\{mcsm_(?:instance_name|run_as|java|steamcmd)\}/i;
const ANY_MCSM_PLACEHOLDER = /\{mcsm_[a-z0-9_]*\}?/i;
const WORKSPACE_VOLUME_PLACEHOLDER = /\{mcsm_(?:workspace|cwd)\}/gi;
// Value-safe tokens: always a single path segment (an id, a random id, a port).
const OPAQUE_VOLUME_PLACEHOLDER = /\{mcsm_(?:uuid|random|instance_id|instance_base_port)\}/gi;
const PORT_VOLUME_PLACEHOLDER = /\{mcsm_port\d+\}/gi;

function resolveVolumePlaceholders(source: string, context: IDockerPolicyContext): string {
  // docker_process_service.ts expands every volume source through
  // Instance.parseTextParams() at container-creation time. Resolve the same tokens
  // here (the workspace, or one opaque path segment) so the checked value and the
  // value that reaches Docker always have the same shape.
  const unsafeToken = UNSAFE_VOLUME_PLACEHOLDER.exec(source)?.[0];
  if (unsafeToken) {
    throw policyError(POLICY_MESSAGES.placeholder, { token: unsafeToken, path: source });
  }

  let resolved = source;
  const workspacePath = context.workspacePaths[context.workspacePaths.length - 1];
  if (workspacePath) {
    resolved = resolved.replace(WORKSPACE_VOLUME_PLACEHOLDER, workspacePath);
  }
  resolved = resolved.replace(OPAQUE_VOLUME_PLACEHOLDER, "mcsm-value");
  resolved = resolved.replace(PORT_VOLUME_PLACEHOLDER, "0");

  const unknownToken = ANY_MCSM_PLACEHOLDER.exec(resolved)?.[0];
  if (unknownToken) {
    throw policyError(POLICY_MESSAGES.placeholder, { token: unknownToken, path: source });
  }
  return resolved;
}

function assertOutsideDaemonRuntime(normalized: string, context: IDockerPolicyContext) {
  if (!context.dataPaths.length) return;

  const windows = isWindowsFlavoredPath(normalized);
  // Paths of different flavours cannot be compared meaningfully.
  const dataPath = context.dataPaths.find(
    (candidate) =>
      isWindowsFlavoredPath(candidate) === windows &&
      isSameOrInside(normalized, candidate, windows)
  );
  if (!dataPath) return;

  // Instance workspaces may legitimately live under the daemon data directory
  // (the default is <daemon cwd>/data/InstanceData/<uuid>) and are mounted by the
  // daemon itself, so only that subtree is exempt. Everything else in data/ —
  // Config/global.json (the panel<->daemon API key), other tenants' configs and
  // logs, schedules — must never become a mount source.
  const exempt = context.workspacePaths.some(
    (workspace) =>
      isWindowsFlavoredPath(workspace) === windows &&
      isSameOrInside(workspace, dataPath, windows) &&
      isSameOrInside(normalized, workspace, windows)
  );
  if (exempt) return;

  throw policyError(POLICY_MESSAGES.daemonData, { path: normalized });
}

function assertNormalizedHostPathAllowed(
  normalized: string,
  context: IDockerPolicyContext,
  options: { allowedFile?: boolean } = {}
) {
  const windows = isWindowsFlavoredPath(normalized);
  if (isDockerControlSocketPath(normalized)) {
    throw policyError(POLICY_MESSAGES.socket, { path: normalized });
  }
  if (!options.allowedFile && isForbiddenHostPath(normalized, windows)) {
    throw policyError(POLICY_MESSAGES.forbiddenPath, { path: normalized });
  }
  assertOutsideDaemonRuntime(normalized, context);
}

/** Validate one host path used as a bind-mount source; throws when it is unsafe. */
function assertHostMountSourceAllowed(rawSource: string, context: IDockerPolicyContext) {
  const resolved = resolveVolumePlaceholders(String(rawSource ?? ""), context);
  const source = resolved.trim();
  if (!source) throw policyError(POLICY_MESSAGES.emptySource);
  if (hasParentTraversal(source)) {
    throw policyError(POLICY_MESSAGES.traversal, { path: source });
  }
  if (!isAbsoluteHostPath(source)) {
    throw policyError(POLICY_MESSAGES.notAbsolute, { path: source });
  }
  if (isDockerControlSocketPath(source)) {
    throw policyError(POLICY_MESSAGES.socket, { path: source });
  }

  const normalized = normalizeHostPath(source);
  assertNormalizedHostPathAllowed(normalized, context);

  // A source may be a symlink on the host (Docker resolves the real path when it
  // creates the mount), so the resolved target must be checked as well. The
  // /etc/localtime style files are exempt in both spellings: the exemption applies
  // to the resolved target of such a file (e.g. /usr/share/zoneinfo/...) and to a
  // symlink that resolves *to* one of them (checked by isForbiddenHostPath).
  const realPath = tryRealPath(normalized);
  if (realPath) {
    const canonical = normalizeHostPath(realPath);
    if (canonical !== normalized) {
      assertNormalizedHostPathAllowed(canonical, context, {
        allowedFile: ALLOWED_HOST_FILES.includes(normalized)
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Tier 1: extra volumes (bind mounts)
// ---------------------------------------------------------------------------

function assertExtraVolumesAllowed(extraVolumes: unknown, context: IDockerPolicyContext) {
  if (extraVolumes == null) return;
  if (!Array.isArray(extraVolumes)) {
    throw policyError(POLICY_MESSAGES.optionInvalid, {
      key: "extraVolumes",
      expected: 'an array of "hostPath|containerPath" strings'
    });
  }

  for (const entry of extraVolumes) {
    const source = typeof entry === "string" ? extractVolumeSource(entry) : undefined;
    if (!source) {
      throw policyError(POLICY_MESSAGES.volumeEntry, { entry: String(entry) });
    }
    assertHostMountSourceAllowed(source, context);
  }
}

// ---------------------------------------------------------------------------
// Tier 2: opt-in options
// ---------------------------------------------------------------------------

/** "sys_admin", "CAP_SYS_ADMIN" and "SYS_ADMIN" all normalise to "SYS_ADMIN". */
export function normalizeCapability(capability: unknown): string {
  return String(capability ?? "")
    .trim()
    .toUpperCase()
    .replace(/^CAP_/, "");
}

function dangerousOptionParams(context: IDockerPolicyContext) {
  return { key: DANGEROUS_OPTIONS_KEY, path: daemonConfigFilePath(context) };
}

function assertCapabilitiesAllowed(capAdd: unknown, context: IDockerPolicyContext) {
  if (capAdd == null) return;
  if (!Array.isArray(capAdd)) {
    throw policyError(POLICY_MESSAGES.optionInvalid, {
      key: "capAdd",
      expected: "an array of capability names"
    });
  }
  if (context.allowDangerousOptions) return;

  for (const entry of capAdd) {
    const capability = normalizeCapability(entry);
    if (DANGEROUS_CAPABILITIES.includes(capability)) {
      throw policyError(POLICY_MESSAGES.capability, {
        cap: String(entry),
        ...dangerousOptionParams(context)
      });
    }
  }
}

function assertNetworkModeAllowed(networkMode: unknown, context: IDockerPolicyContext) {
  if (networkMode == null) return;
  if (typeof networkMode !== "string") {
    throw policyError(POLICY_MESSAGES.optionInvalid, {
      key: "networkMode",
      expected: "a network mode string"
    });
  }

  const mode = networkMode.trim().toLowerCase();
  if (!mode || context.allowDangerousOptions) return;
  // Everything that is a plain network name (bridge, none, a user-defined
  // network, ...) stays allowed; the host namespace and another container's
  // namespace are not.
  if (mode === "host" || mode.startsWith("container:")) {
    throw policyError(POLICY_MESSAGES.networkMode, {
      mode: networkMode,
      ...dangerousOptionParams(context)
    });
  }
}

function assertDevicesAllowed(devices: unknown, context: IDockerPolicyContext) {
  if (devices == null) return;
  if (!Array.isArray(devices)) {
    throw policyError(POLICY_MESSAGES.optionInvalid, {
      key: "devices",
      expected: 'an array of "hostDevice|containerDevice|permissions" strings'
    });
  }
  if (devices.length === 0 || context.allowDangerousOptions) return;
  throw policyError(POLICY_MESSAGES.devices, dangerousOptionParams(context));
}

function assertPrivilegedAllowed(privileged: unknown, context: IDockerPolicyContext) {
  if (!privileged || context.allowDangerousOptions) return;
  throw policyError(POLICY_MESSAGES.privileged, dangerousOptionParams(context));
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Validate an incoming (or persisted) instance Docker configuration.
 *
 * Throws a descriptive Error for every rejected value and never mutates the
 * configuration it receives, so callers can validate first and apply afterwards.
 */
export function assertDockerConfigAllowed(
  docker: Partial<IGlobalInstanceDockerConfig> | null | undefined,
  options: IDockerPolicyOptions = {}
): void {
  if (!docker || typeof docker !== "object" || Array.isArray(docker)) return;

  const runtimeDataPath = options.runtimeDataPath ?? StorageSubsystem.DATA_PATH;
  const context: IDockerPolicyContext = {
    allowDangerousOptions: options.allowDangerousOptions === true,
    dataPaths: hostPathVariants(runtimeDataPath),
    workspacePaths: hostPathVariants(options.workspacePath)
  };

  assertExtraVolumesAllowed(docker.extraVolumes, context);
  assertPrivilegedAllowed(docker.privileged, context);
  assertCapabilitiesAllowed(docker.capAdd, context);
  assertNetworkModeAllowed(docker.networkMode, context);
  assertDevicesAllowed(docker.devices, context);
}
