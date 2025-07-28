import { t } from "i18next";
import { commandStringToArray } from "../entity/commands/base/command_parser";
import DockerPullCommand from "../entity/commands/docker/docker_pull";
import Instance from "../entity/instance/instance";
import { DefaultDocker } from "./docker_service";

import path from "path";
import { $t } from "../i18n";
import logger from "./log";
import Docker from "dockerode";
import { EventEmitter } from "stream";
import { IInstanceProcess } from "../entity/instance/interface";
import { AsyncTask } from "./async_task_service";
import iconv from "iconv-lite";
import { toText } from "mcsmanager-common";
import fs from "fs-extra";

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
    // Docker Image check
    try {
      await instance.forceExec(new DockerPullCommand());
    } catch (error: any) {
      throw error;
    }

    // Command text parsing
    let commandList: string[];
    if (instance.config?.startCommand?.trim() || customCommand?.trim()) {
      commandList = commandStringToArray(customCommand ?? instance.config.startCommand);
    } else {
      commandList = [];
    }

    // Parsing port open
    // 25565:25565/tcp 8080:8080/tcp
    const portMap = instance.config.docker.ports || [];
    const publicPortArray: any = {};
    const exposedPorts: any = {};
    for (const iterator of portMap) {
      const elem = iterator.split("/");
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
    }

    // resolve extra path mounts
    const extraVolumes = instance.config.docker.extraVolumes || [];
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
    if (instance.config.docker.memory) maxMemory = instance.config.docker.memory * 1024 * 1024;

    // CPU usage calculation
    let cpuQuota: number | undefined = undefined;
    let cpuPeriod: number | undefined = undefined;
    if (instance.config.docker.cpuUsage) {
      cpuQuota = instance.config.docker.cpuUsage * 10 * 1000;
      cpuPeriod = 1000 * 1000;
    }

    // Check the number of CPU cores
    let cpusetCpus: string | undefined = undefined;
    if (instance.config.docker.cpusetCpus) {
      const arr = instance.config.docker.cpusetCpus.split(",");
      arr.forEach((v: string) => {
        if (isNaN(Number(v))) throw new Error($t("TXT_CODE_instance.invalidCpu", { v }));
      });
      cpusetCpus = instance.config.docker.cpusetCpus;
    }

    // container name check
    let containerName =
      instance.config.docker.containerName || `MCSM-${instance.instanceUuid.slice(0, 6)}`;
    if (containerName && (containerName.length > 64 || containerName.length < 2)) {
      throw new Error($t("TXT_CODE_instance.invalidContainerName", { v: containerName }));
    }

    // Whether to use TTY mode
    const isTty = instance.config.terminalOption.pty;

    const workingDir = instance.config.docker.workingDir || undefined;

    let cwd = instance.absoluteCwdPath();
    const hostRealPath = toText(process.env.MCSM_DOCKER_WORKSPACE_PATH);
    if (hostRealPath) {
      cwd = path.normalize(path.join(hostRealPath, instance.instanceUuid));
    }

    if (workingDir) {
      instance.println("CONTAINER", $t("TXT_CODE_e76e49e9") + cwd + " --> " + workingDir + "\n");
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
    logger.info(`NET_MODE: ${instance.config.docker.networkMode}`);
    logger.info(`OPEN_PORT: ${JSON.stringify(publicPortArray)}`);
    logger.info(`Volume Mounts: ${JSON.stringify(mounts)}`);
    logger.info(`NET_ALIASES: ${JSON.stringify(instance.config.docker.networkAliases)}`);
    logger.info(`MEM_LIMIT: ${maxMemory || "--"} MB`);
    logger.info(`TYPE: Docker Container`);
    logger.info("----------------");

    // Start Docker container creation and running
    const docker = new DefaultDocker();
    this.container = await docker.createContainer({
      name: containerName,
      Hostname: containerName,
      Image: instance.config.docker.image,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: isTty,
      WorkingDir: instance.config.docker.changeWorkdir ? workingDir : undefined,
      Cmd: commandList.length > 0 ? commandList : undefined,
      OpenStdin: true,
      StdinOnce: false,
      ExposedPorts: exposedPorts,
      Env: instance.config.docker?.env || [],
      User: instance.config.runAs || undefined,
      Labels: {
        "mcsmanager.instance.uuid": instance.instanceUuid
      },
      HostConfig: {
        Memory: maxMemory,
        AutoRemove: true,
        CpusetCpus: cpusetCpus,
        CpuPeriod: cpuPeriod,
        CpuQuota: cpuQuota,
        PortBindings: publicPortArray,
        NetworkMode: instance.config.docker.networkMode,
        Mounts: mounts
      },
      NetworkingConfig: {
        EndpointsConfig: {
          [instance.config.docker.networkMode || "bridge"]: {
            Aliases: instance.config.docker.networkAliases
          }
        }
      }
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
