import { $t } from "../../../i18n";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";
import Docker from "dockerode";
import logger from "../../../service/log";
import { EventEmitter } from "events";
import { IInstanceProcess } from "../../instance/interface";
import fs from "fs-extra";
import { commandStringToArray } from "../base/command_parser";
import path from "path";
import { t } from "i18next";
import DockerPullCommand from "./docker_pull";
import os from "os";

// user identity function
const processUserUid = process.getuid ? process.getuid : () => 0;
const processGroupGid = process.getgid ? process.getgid : () => 0;

// Error exception at startup
class StartupDockerProcessError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

interface IDockerProcessAdapterStartParam {
  isTty: boolean;
  h: number;
  w: number;
}

// process adapter
export class DockerProcessAdapter extends EventEmitter implements IInstanceProcess {
  pid?: number | string;

  private stream?: NodeJS.ReadWriteStream;

  constructor(public container: Docker.Container) {
    super();
  }

  // Once the program is actually started, no errors can block the next startup process
  public async start(param: IDockerProcessAdapterStartParam) {
    try {
      await this.container.start();

      const { isTty, h, w } = param;
      if (isTty) {
        this.container.resize({ h, w });
      }

      this.pid = this.container.id;
      const stream = (this.stream = await this.container.attach({
        stream: true,
        stdout: true,
        stderr: true,
        stdin: true
      }));
      stream.on("data", (data) => this.emit("data", data));
      stream.on("error", (data) => this.emit("data", data));
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
    await this.container.kill();
    return true;
  }

  public async destroy() {
    try {
      await this.container.remove();
    } catch (error: any) {}
  }

  private wait() {
    this.container.wait(async (v) => {
      await this.destroy();
      this.emit("exit", v);
    });
  }
}

export default class DockerStartCommand extends InstanceCommand {
  constructor() {
    super("DockerStartCommand");
  }

  async exec(instance: Instance, source = "Unknown") {
    if (!instance.config.cwd || !instance.config.ie || !instance.config.oe)
      throw new StartupDockerProcessError($t("TXT_CODE_instance.dirEmpty"));
    if (!fs.existsSync(instance.absoluteCwdPath()))
      throw new StartupDockerProcessError($t("TXT_CODE_instance.dirNoE"));

    // Docker Image check
    try {
      await instance.forceExec(new DockerPullCommand());
    } catch (error: any) {
      throw error;
    }

    // Command text parsing
    let commandList: string[] = [];
    if (instance.config.startCommand.trim()) {
      commandList = commandStringToArray(instance.config.startCommand);
    } else {
      commandList = [];
    }

    const cwd = instance.absoluteCwdPath();

    // Parsing port open
    // 25565:25565/tcp 8080:8080/tcp
    const portMap = instance.config.docker.ports || [];
    const publicPortArray: any = {};
    const exposedPorts: any = {};
    for (const iterator of portMap) {
      const elem = iterator.split("/");
      if (elem.length != 2) throw new Error(t("TXT_CODE_1cf6fc4b"));
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
    let maxMemory = undefined;
    if (instance.config.docker.memory) maxMemory = instance.config.docker.memory * 1024 * 1024;

    // CPU usage calculation
    let cpuQuota = undefined;
    let cpuPeriod = undefined;
    if (instance.config.docker.cpuUsage) {
      cpuQuota = instance.config.docker.cpuUsage * 10 * 1000;
      cpuPeriod = 1000 * 1000;
    }

    // Check the number of CPU cores
    let cpusetCpus = undefined;
    if (instance.config.docker.cpusetCpus) {
      const arr = instance.config.docker.cpusetCpus.split(",");
      arr.forEach((v) => {
        if (isNaN(Number(v))) throw new Error($t("TXT_CODE_instance.invalidCpu", { v }));
      });
      cpusetCpus = instance.config.docker.cpusetCpus;
      // Note: check
    }

    // container name check
    let containerName =
      instance.config.docker.containerName || `MCSM-${instance.instanceUuid.slice(0, 6)}`;
    if (containerName && (containerName.length > 64 || containerName.length < 2)) {
      throw new Error($t("TXT_CODE_instance.invalidContainerName", { v: containerName }));
    }

    // Whether to use TTY mode
    const isTty = instance.config.terminalOption.pty;
    const workingDir = instance.config.docker.workingDir ?? "/workspace/";

    // output startup log
    logger.info("----------------");
    logger.info(`Session ${source}: Request to start an instance`);
    logger.info(`UUID: [${instance.instanceUuid}] [${instance.config.nickname}]`);
    logger.info(`NAME: [${containerName}]`);
    logger.info(`COMMAND: ${commandList.join(" ")}`);
    logger.info(`CWD: ${cwd}, WORKING_DIR: ${workingDir}`);
    logger.info(`NET_MODE: ${instance.config.docker.networkMode}`);
    logger.info(`OPEN_PORT: ${JSON.stringify(publicPortArray)}`);
    logger.info(`BINDS: ${JSON.stringify([`${cwd}->${workingDir}`, ...extraBinds])}`);
    logger.info(`NET_ALIASES: ${JSON.stringify(instance.config.docker.networkAliases)}`);
    logger.info(`MEM_LIMIT: ${maxMemory || "--"} MB`);
    logger.info(`TYPE: Docker Container`);
    logger.info("----------------");

    // Start Docker container creation and running
    const docker = new Docker();
    const container = await docker.createContainer({
      name: containerName,
      Hostname: containerName,
      Image: instance.config.docker.image,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: isTty,
      WorkingDir: workingDir,
      Cmd: commandList ? commandList : undefined,
      OpenStdin: true,
      StdinOnce: false,
      ExposedPorts: exposedPorts,
      Env: instance.config.docker?.env || [],
      HostConfig: {
        Memory: maxMemory,
        AutoRemove: true,
        CpusetCpus: cpusetCpus,
        CpuPeriod: cpuPeriod,
        CpuQuota: cpuQuota,
        PortBindings: publicPortArray,
        NetworkMode: instance.config.docker.networkMode,
        Mounts: [
          {
            Type: "bind",
            Source: cwd,
            Target: workingDir
          },
          ...extraBinds.map((v) => {
            return {
              Type: "bind" as Docker.MountType,
              Source: v.hostPath,
              Target: v.containerPath
            };
          })
        ]
      },
      NetworkingConfig: {
        EndpointsConfig: {
          [instance.config.docker.networkMode || "bridge"]: {
            Aliases: instance.config.docker.networkAliases
          }
        }
      }
    });

    // Docker docks to the process adapter
    const processAdapter = new DockerProcessAdapter(container);
    await processAdapter.start({
      isTty,
      w: instance.config.terminalOption.ptyWindowCol,
      h: instance.config.terminalOption.ptyWindowCol
    });

    instance.println("CONTAINER", t("TXT_CODE_e76e49e9") + workingDir);
    instance.started(processAdapter);
    logger.info(
      $t("TXT_CODE_instance.successful", {
        v: `${instance.config.nickname} ${instance.instanceUuid}`
      })
    );
  }
}
