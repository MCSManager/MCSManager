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

type PublicPortArray = {
  [key: string]: { HostPort: string }[];
};

type ExposedPorts = {
  [key: string]: {};
};

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
      commandList = commandStringToArray(instance.parseTextParams(tmpCmd));
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
      const elem = instance.parseTextParams(portConfigText).split("/");
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

    let cwd = instance.absoluteCwdPath();
    const hostRealPath = toText(process.env.MCSM_DOCKER_WORKSPACE_PATH);
    if (hostRealPath) {
      cwd = path.normalize(path.join(hostRealPath, instance.instanceUuid));
    }

    const mounts: Docker.MountConfig =
      extraBinds.map((v) => {
        const hostPath = instance.parseTextParams(v.hostPath);
        if (!fs.existsSync(hostPath)) fs.mkdirsSync(hostPath);
        return {
          Type: "bind",
          Source: hostPath,
          Target: instance.parseTextParams(v.containerPath)
        };
      }) || [];
    if (workingDir && cwd) {
      mounts.push({
        Type: "bind",
        Source: cwd,
        Target: instance.parseTextParams(workingDir)
      });
    }

    logger.info("----------------");
    logger.info(`[SetupDockerContainer]`);
    logger.info(`UUID: [${instance.instanceUuid}] [${instance.config.nickname}]`);
    logger.info(`NAME: [${containerName}]`);
    logger.info(`COMMAND: ${commandList.join(" ")}`);
    logger.info(`CWD: ${cwd}, WORKING_DIR: ${workingDir}`);
    logger.info(`NET_MODE: ${dockerConfig.networkMode}`);
    logger.info(`OPEN_PORT: ${JSON.stringify(publicPortArray)}`);
    logger.info(`Volume Mounts: ${JSON.stringify(mounts)}`);
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

    this.container = await docker.createContainer({
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
      Env: dockerConfig?.env || [],
      User: instance.config.runAs || undefined,
      Labels: {
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
        Mounts: mounts
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
    });

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
