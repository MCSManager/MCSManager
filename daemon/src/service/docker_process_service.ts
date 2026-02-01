import { t } from "i18next";
import { commandStringToArray } from "../entity/commands/base/command_parser";
import DockerPullCommand from "../entity/commands/docker/docker_pull";
import Instance from "../entity/instance/instance";
import { DefaultDocker } from "./docker_service";

import Docker from "dockerode";
import fs from "fs-extra";
import iconv from "iconv-lite";
import { toText } from "mcsmanager-common";
import path from "path";
import { EventEmitter } from "stream";
import { IInstanceProcess } from "../entity/instance/interface";
import { $t } from "../i18n";
import { AsyncTask } from "./async_task_service";
import logger from "./log";
import InstanceSubsystem from "./system_instance";

type PublicPortArray = {
  [key: string]: { HostPort: string }[];
};

type ExposedPorts = {
  [key: string]: {};
};

function buildContainerEnv(dockerConfig: IGlobalInstanceDockerConfig): string[] {
  const rawEnv = Array.isArray(dockerConfig.env) ? dockerConfig.env : [];
  const env = rawEnv.filter((v) => typeof v === "string" && v.trim() !== "");

  const enableTimezone = dockerConfig.enableTimezone === true;
  const timezone = (dockerConfig.timezone ?? "").trim();
  if (!enableTimezone || !timezone) return env;

  const withoutTz = env.filter((item) => {
    const index = item.indexOf("=");
    const key = (index >= 0 ? item.slice(0, index) : item).trim();
    return key !== "TZ";
  });

  return [...withoutTz, `TZ=${timezone}`];
}

function normalizeContainerPath(p: string) {
  return p.replace(/\\/g, "/");
}

function hasMountTarget(mounts: Docker.MountSettings[], target: string) {
  const normalizedTarget = normalizeContainerPath(target);
  return mounts.some(
    (item) => normalizeContainerPath(String((item as any)?.Target ?? "")) === normalizedTarget
  );
}

function sanitizeTimezoneName(timezone: string) {
  const oneLine = (timezone ?? "").split(/\r?\n/)[0]?.trim();
  if (!oneLine) return null;
  if (oneLine.length > 128) return null;
  if (oneLine.includes("..")) return null;
  if (oneLine.startsWith("/") || oneLine.startsWith("\\")) return null;
  if (!/^[A-Za-z0-9._+-]+(\/[A-Za-z0-9._+-]+)*$/.test(oneLine)) return null;
  return oneLine;
}

function formatUnknownError(err: unknown) {
  if (err instanceof Error) return err.message;
  try {
    return typeof err === "string" ? err : JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function isTimezoneMountError(err: unknown, sourceHints: string[]) {
  const message = formatUnknownError(err);
  const lowerMessage = message.toLowerCase();

  if (sourceHints.some((h) => h && message.includes(h))) return true;

  return (
    lowerMessage.includes("bind source path does not exist") ||
    lowerMessage.includes("invalid mount config") ||
    lowerMessage.includes("invalid volume specification") ||
    lowerMessage.includes("mounts denied") ||
    lowerMessage.includes("no such file or directory")
  );
}

// Error exception at startup
export class StartupDockerProcessError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

export interface IDockerProcessAdapterStartParam {
  isTty: boolean;
  h: number;
  w: number;
}

export class SetupDockerContainer extends AsyncTask {
  private container?: Docker.Container;

  constructor(public readonly instance: Instance, public readonly startCommand?: string) {
    super();
  }

  public async onStart() {
    const instance = this.instance;
    const customCommand = this.startCommand;

    try {
      await instance.forceExec(new DockerPullCommand());
    } catch (error: any) {
      throw error;
    }

    // Command text parsing
    let commandList: string[];
    if (instance.config?.startCommand?.trim() || customCommand?.trim()) {
      const tmpCmd = customCommand ?? instance.config.startCommand;
      commandList = commandStringToArray(await instance.parseTextParams(tmpCmd));
    } else {
      commandList = [];
    }
    const dockerConfig = instance.config.docker;
    if (!dockerConfig) {
      throw new Error("Instance's Docker configuration is not found! ");
    }

    // Parsing port open
    // 25565:25565/tcp 8080:8080/tcp
    const portMap = dockerConfig.ports || [];

    const logOpenedPorts: { host: number; container: number; protocol: string }[] = [];
    const publicPortArray: PublicPortArray = {};
    const exposedPorts: ExposedPorts = {};
    for (const portConfigText of portMap) {
      const elem = (await instance.parseTextParams(portConfigText)).split("/");
      if (elem.length != 2) throw new Error($t("TXT_CODE_1cf6fc4b"));
      const ports = elem[0];
      const protocol = elem[1];
      //Host (host) port: container port
      const publicAndPrivatePort = ports.split(":");
      if (publicAndPrivatePort.length != 2) throw new Error(t("TXT_CODE_2029027e"));
      publicPortArray[`${publicAndPrivatePort[1]}/${protocol}`] = [
        { HostPort: publicAndPrivatePort[0] }
      ];
      exposedPorts[`${publicAndPrivatePort[1]}/${protocol}`] = {};
      logOpenedPorts.push({
        host: Number(publicAndPrivatePort[0]),
        container: Number(publicAndPrivatePort[1]),
        protocol: protocol
      });
    }

    // resolve extra path mounts
    const extraVolumes = dockerConfig.extraVolumes || [];
    const extraBinds: { hostPath: string; containerPath: string }[] = [];
    for (const item of extraVolumes) {
      if (!item) throw new Error($t("TXT_CODE_ae441ea3"));
      const paths = item.split("|");
      if (paths.length < 2) throw new Error($t("TXT_CODE_dca030b8"));
      const hostPath = path.normalize(paths[0]);
      const containerPath = path.normalize(paths[1]);
      extraBinds.push({ hostPath, containerPath });
    }

    // memory limit
    let maxMemory: number | undefined = undefined;
    if (typeof dockerConfig.memory === "number" && dockerConfig.memory > 0)
      maxMemory = dockerConfig.memory * 1024 * 1024;

    // CPU usage calculation
    let cpuQuota: number | undefined = undefined;
    let cpuPeriod: number | undefined = undefined;
    if (typeof dockerConfig.cpuUsage === "number" && dockerConfig.cpuUsage > 0) {
      cpuQuota = dockerConfig.cpuUsage * 10 * 1000;
      cpuPeriod = 1000 * 1000;
    }

    // Check the number of CPU cores
    let cpusetCpus: string | undefined = undefined;
    if (dockerConfig.cpusetCpus) {
      const arr = dockerConfig.cpusetCpus.split(",");
      arr.forEach((v: string) => {
        if (isNaN(Number(v))) throw new Error($t("TXT_CODE_instance.invalidCpu", { v }));
      });
      cpusetCpus = dockerConfig.cpusetCpus;
    }

    // memory swap and swappiness
    let memorySwap: number | undefined = undefined;
    let memorySwappiness: number | undefined = undefined;
    if (typeof dockerConfig.memorySwap === "number" && maxMemory)
      memorySwap = dockerConfig.memorySwap * 1024 * 1024 + maxMemory;
    if (
      typeof dockerConfig.memorySwappiness === "number" &&
      dockerConfig.memorySwappiness <= 100 &&
      dockerConfig.memorySwappiness >= 0 &&
      maxMemory
    )
      memorySwappiness = dockerConfig.memorySwappiness;

    // container name check
    let containerName = dockerConfig.containerName || `MCSM-${instance.instanceUuid.slice(0, 6)}`;
    if (containerName && (containerName.length > 64 || containerName.length < 2)) {
      throw new Error($t("TXT_CODE_instance.invalidContainerName", { v: containerName }));
    }

    // Whether to use TTY mode
    const isTty = instance.config.terminalOption.pty;

    const workingDir = dockerConfig.workingDir || undefined;

    // capabilities
    const capAdd = dockerConfig.capAdd || [];
    const capDrop = dockerConfig.capDrop || [];

    // resolve devices
    // /dev/a, /dev/a|dev/b, /dev/a|/dev/b|rwm, /dev/a||rwm
    const devices = dockerConfig.devices || [];
    const parsedDevices: { PathOnHost: string; PathInContainer: string; CgroupPermissions: string }[] = [];
    for (const item of devices) {
      if (!item) throw new Error($t("TXT_CODE_ae441ea4"));
      const parts = item.split("|").map(p => p.trim());
      if (!parts[0]) throw new Error($t("TXT_CODE_ae441ea4"));
      parsedDevices.push({
        PathOnHost: parts[0],
        PathInContainer: parts[1] || parts[0],
        CgroupPermissions: parts[2] || "rwm"
      });
    }

    const privileged = dockerConfig.privileged || false;

    const fsCwd = instance.absoluteCwdPath();
    let cwd = fsCwd;
    const defaultInstanceDir = InstanceSubsystem.getInstanceDataDir();
    const hostRealPath = toText(process.env.MCSM_DOCKER_WORKSPACE_PATH);
    if (hostRealPath && fsCwd.includes(defaultInstanceDir)) {
      cwd = path.normalize(path.join(hostRealPath, instance.instanceUuid));
    }

    const baseMounts: Docker.MountSettings[] = [];
    for (const v of extraBinds) {
      const hostPath = await instance.parseTextParams(v.hostPath);
      if (!fs.existsSync(hostPath)) fs.mkdirsSync(hostPath);
      baseMounts.push({
        Type: "bind",
        Source: hostPath,
        Target: await instance.parseTextParams(v.containerPath)
      });
    }
    if (workingDir && cwd) {
      baseMounts.push({
        Type: "bind",
        Source: cwd,
        Target: await instance.parseTextParams(workingDir)
      });
    }

    const timezone = sanitizeTimezoneName(dockerConfig.timezone ?? "");
    const enableTimezone = dockerConfig.enableTimezone === true && timezone;
    const canInjectTimezoneFiles = enableTimezone && process.platform !== "win32";

    const tzHostZoneinfoDir = "/usr/share/zoneinfo";
    const hasHostZoneinfoDir = canInjectTimezoneFiles && fs.existsSync(tzHostZoneinfoDir);

    const tzFileMount: Docker.MountSettings | undefined = canInjectTimezoneFiles
      ? !hasMountTarget(baseMounts, "/etc/timezone")
        ? {
            Type: "bind",
            Source: path.join(cwd, ".mcsm_timezone"),
            Target: "/etc/timezone",
            ReadOnly: true
          }
        : undefined
      : undefined;

    const tzLocaltimeMount: Docker.MountSettings | undefined = canInjectTimezoneFiles
      ? !hasMountTarget(baseMounts, "/etc/localtime")
        ? {
            Type: "bind",
            Source: `/usr/share/zoneinfo/${timezone}`,
            Target: "/etc/localtime",
            ReadOnly: true
          }
        : undefined
      : undefined;

    const tzZoneinfoMount: Docker.MountSettings | undefined =
      hasHostZoneinfoDir && !hasMountTarget(baseMounts, tzHostZoneinfoDir)
        ? {
            Type: "bind",
            Source: tzHostZoneinfoDir,
            Target: tzHostZoneinfoDir,
            ReadOnly: true
          }
        : undefined;

    if (tzFileMount) {
      try {
        await fs.outputFile(path.join(fsCwd, ".mcsm_timezone"), `${timezone}\n`, "utf-8");
      } catch (error) {
        logger.warn(
          `[SetupDockerContainer] Failed to write timezone file for container: ${formatUnknownError(
            error
          )}`
        );
      }
    }

    const mountsWithTimezone: Docker.MountSettings[] = [
      ...baseMounts,
      ...(tzFileMount ? [tzFileMount] : []),
      ...(tzLocaltimeMount ? [tzLocaltimeMount] : []),
      ...(tzZoneinfoMount ? [tzZoneinfoMount] : [])
    ];

    logger.info("----------------");
    logger.info(`[SetupDockerContainer]`);
    logger.info(`UUID: [${instance.instanceUuid}] [${instance.config.nickname}]`);
    logger.info(`NAME: [${containerName}]`);
    logger.info(`COMMAND: ${commandList.join(" ")}`);
    logger.info(`CWD: ${cwd}, WORKING_DIR: ${workingDir}`);
    logger.info(`NET_MODE: ${dockerConfig.networkMode}`);
    logger.info(`OPEN_PORT: ${JSON.stringify(publicPortArray)}`);
    logger.info(`Volume Mounts: ${JSON.stringify(mountsWithTimezone)}`);
    logger.info(`NET_ALIASES: ${JSON.stringify(dockerConfig.networkAliases)}`);

    logger.info(
      `MEM_LIMIT: ${maxMemory ? (maxMemory / 1024 / 1024).toFixed(2) : "--"} MB, Swap: ${
        memorySwap ? (memorySwap / 1024 / 1024).toFixed(2) : "--"
      } MB`
    );
    logger.info(`TYPE: Docker Container`);

    if (workingDir) {
      instance.println("INFO", $t("TXT_CODE_e76e49e9") + cwd + " --> " + workingDir + "\n");
    }

    if (logOpenedPorts.length) {
      instance.info.allocatedPorts = logOpenedPorts;
      instance.println("INFO", $t("TXT_CODE_c1c548fb"));
      logOpenedPorts.forEach((v) => {
        instance.println(
          "INFO",
          $t("TXT_CODE_1e03347e", {
            host: v.host,
            container: v.container,
            protocol: v.protocol
          })
        );
      });
    } else {
      instance.info.allocatedPorts = [];
    }

    // Start Docker container creation and running
    const docker = new DefaultDocker();
    const containerEnv = buildContainerEnv(dockerConfig);

    let entrypoint: string | string[] | undefined = commandList.length ? commandList[0] : undefined;
    const startCmd = commandList.length > 1 ? commandList.slice(1) : undefined;

    // Compatible with Docker API v29+: Entrypoint must be an array type
    const { Version: dockerVersion } = await docker.version();
    const versionNum = dockerVersion.split(".")[0];
    if (Number(versionNum.replace("v", "")) >= 29 && entrypoint !== undefined) {
      entrypoint = [entrypoint];
    }

    logger.info(`Container Entrypoint: ${entrypoint}`);
    logger.info(`Container Start Command: ${startCmd}`);
    logger.info(`Docker Version: ${dockerVersion}`);
    logger.info("----------------");

    const createContainerOptions: Docker.ContainerCreateOptions = {
      Entrypoint: entrypoint,
      Cmd: startCmd,
      name: containerName,
      Hostname: containerName,
      Image: dockerConfig.image,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: isTty,
      WorkingDir: dockerConfig.changeWorkdir ? workingDir : undefined,
      OpenStdin: true,
      StdinOnce: false,
      ExposedPorts: exposedPorts,
      Env: containerEnv,
      User: instance.config.runAs || undefined,
      Labels: {
        ...dockerConfig.labels
          ?.map((label) => {
            const [key, ...rest] = label.split("=");
            return { [key]: rest.join("=") };
          })
          .reduce((acc, cur) => ({ ...acc, ...cur }), {}),
        "mcsmanager.instance.uuid": instance.instanceUuid
      },
      HostConfig: {
        Memory: maxMemory,
        MemorySwap: memorySwap,
        MemorySwappiness: memorySwappiness,
        AutoRemove: true,
        CpusetCpus: cpusetCpus,
        CpuPeriod: cpuPeriod,
        CpuQuota: cpuQuota,
        PortBindings: publicPortArray,
        NetworkMode: dockerConfig.networkMode,
        Mounts: mountsWithTimezone,
        CapAdd: capAdd,
        CapDrop: capDrop,
        Devices: parsedDevices,
        Privileged: privileged
      },
      // Only set NetworkingConfig for non-host network modes
      // host mode uses the host's network stack and doesn't support EndpointsConfig
      ...(dockerConfig.networkMode !== "host" &&
        dockerConfig.networkMode !== "none" && {
          NetworkingConfig: {
            EndpointsConfig: {
              [dockerConfig.networkMode || "bridge"]: {
                Aliases: dockerConfig.networkAliases
              }
            }
          }
        })
    };

    const tzMountSourceHints = [
      tzFileMount?.Source,
      tzLocaltimeMount?.Source,
      tzZoneinfoMount?.Source,
      tzFileMount ? "/etc/timezone" : undefined,
      tzLocaltimeMount ? "/etc/localtime" : undefined,
      tzZoneinfoMount ? "/usr/share/zoneinfo" : undefined
    ].filter(Boolean) as string[];

    try {
      this.container = await docker.createContainer(createContainerOptions);
    } catch (error) {
      // If timezone-related mounts fail (e.g. host missing zoneinfo or Docker Desktop denies mounts),
      // degrade gracefully instead of failing the whole instance start.
      if (!tzMountSourceHints.length || !isTimezoneMountError(error, tzMountSourceHints)) throw error;

      logger.warn(
        `[SetupDockerContainer] Timezone mounts failed, retrying without /etc/localtime mount: ${formatUnknownError(
          error
        )}`
      );

      const mountsWithoutLocaltime: Docker.MountSettings[] = [
        ...baseMounts,
        ...(tzFileMount ? [tzFileMount] : []),
        ...(tzZoneinfoMount ? [tzZoneinfoMount] : [])
      ];

      try {
        this.container = await docker.createContainer({
          ...createContainerOptions,
          HostConfig: {
            ...createContainerOptions.HostConfig,
            Mounts: mountsWithoutLocaltime
          }
        });
      } catch (error2) {
        logger.warn(
          `[SetupDockerContainer] Timezone mounts failed, retrying without /usr/share/zoneinfo mount: ${formatUnknownError(
            error2
          )}`
        );

        const mountsWithoutZoneinfo: Docker.MountSettings[] = [
          ...baseMounts,
          ...(tzFileMount ? [tzFileMount] : [])
        ];

        try {
          this.container = await docker.createContainer({
            ...createContainerOptions,
            HostConfig: {
              ...createContainerOptions.HostConfig,
              Mounts: mountsWithoutZoneinfo
            }
          });
        } catch (error3) {
          logger.warn(
            `[SetupDockerContainer] Timezone file mount failed, retrying without timezone mounts: ${formatUnknownError(
              error3
            )}`
          );

          this.container = await docker.createContainer({
            ...createContainerOptions,
            HostConfig: {
              ...createContainerOptions.HostConfig,
              Mounts: baseMounts
            }
          });
        }
      }
    }

    await this.container.start();

    // Listen to events
    this.container.wait(() => this.stop());
  }

  public async onStop() {
    try {
      await this.container?.kill();
    } catch (error) {}
    try {
      await this.container?.remove();
    } catch (error) {}
  }

  public getContainer() {
    if (!this.container) throw new Error("Function getContainer(): Failed, Container is Null!");
    return this.container;
  }

  public async attach(instance: Instance) {
    const outputCode = instance.config.terminalOption.pty ? "utf-8" : instance.config.oe;
    const container = this.container;
    if (!container) throw new Error("Attach Failed, Container is Null!");
    try {
      const stream = await container.attach({
        stream: true,
        stdout: true,
        stderr: true,
        stdin: true,
        hijack: true
      });
      stream.on("data", (text: any) => instance.print(iconv.decode(text, outputCode)));
      stream.on("error", (text: any) => instance.print(iconv.decode(text, outputCode)));
    } catch (error: any) {
      this.error(error);
      throw error;
    }
  }

  public async onError(err: Error) {}

  public toObject() {}
}

// SubProcess adapter for Instance
export class DockerProcessAdapter extends EventEmitter implements IInstanceProcess {
  pid?: number | string;

  private stream?: NodeJS.ReadWriteStream;
  public container?: Docker.Container;

  constructor(public readonly containerWrapper: SetupDockerContainer) {
    super();
  }

  // Once the program is actually started, no errors can block the next startup process
  public async start(param: IDockerProcessAdapterStartParam, container?: Docker.Container) {
    try {
      if (container) {
        this.container = container;
      } else {
        await this.containerWrapper.start();
        this.container = this.containerWrapper.getContainer();
      }

      const { isTty, h, w } = param;
      if (isTty) {
        this.container.resize({ h, w });
      }

      this.pid = this.container.id;
      this.stream = await this.container.attach({
        stream: true,
        stdout: true,
        stderr: true,
        stdin: true,
        hijack: true
      });
      this.stream.on("data", (data) => this.emit("data", data));
      this.stream.on("error", (data) => this.emit("data", data));
      this.wait();
    } catch (error: any) {
      this.kill();
      throw error;
    }
  }

  public write(data?: string) {
    if (this.stream && data) this.stream.write(data);
  }

  public async kill(s?: string) {
    await this.container?.kill();
    return true;
  }

  public async destroy() {
    try {
      await this.container?.remove();
    } catch (error: any) {}
  }

  private wait() {
    this.container?.wait(async (v) => {
      await this.destroy();
      this.emit("exit", v);
    });
  }
}
