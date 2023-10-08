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

  private stream: NodeJS.ReadWriteStream;

  constructor(public container: Docker.Container) {
    super();
  }

  // Once the program is actually started, no errors can block the next startup process
  public async start(param?: IDockerProcessAdapterStartParam) {
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
    } catch (error) {
      this.kill();
      throw error;
    }
  }

  public write(data?: string) {
    if (this.stream) this.stream.write(data);
  }

  public async kill(s?: string) {
    await this.container.kill();
    return true;
  }

  public async destroy() {
    try {
      await this.container.remove();
    } catch (error) {}
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
      return instance.failure(new StartupDockerProcessError($t("TXT_CODE_instance.dirEmpty")));
    if (!fs.existsSync(instance.absoluteCwdPath()))
      return instance.failure(new StartupDockerProcessError($t("TXT_CODE_instance.dirNoE")));

    // command parsing
    const commandList = commandStringToArray(instance.config.startCommand);
    const cwd = instance.absoluteCwdPath();

    // parsing port open
    // {
    // "PortBindings": {
    // "22/tcp": [
    // {
    // "HostPort": "11022"
    // }
    // ]
    // }
    // }
    // 25565:25565/tcp 8080:8080/tcp
    const portMap = instance.config.docker.ports;
    const publicPortArray: any = {};
    const exposedPorts: any = {};
    for (const iterator of portMap) {
      const elemt = iterator.split("/");
      if (elemt.length != 2) continue;
      const ports = elemt[0];
      const protocol = elemt[1];
      //Host (host) port: container port
      const publicAndPrivatePort = ports.split(":");
      if (publicAndPrivatePort.length != 2) continue;
      publicPortArray[`${publicAndPrivatePort[1]}/${protocol}`] = [
        { HostPort: publicAndPrivatePort[0] }
      ];
      exposedPorts[`${publicAndPrivatePort[1]}/${protocol}`] = {};
    }

    // resolve extra path mounts
    const extraVolumes = instance.config.docker.extraVolumes;
    const extraBinds = [];
    for (const it of extraVolumes) {
      if (!it) continue;
      const element = it.split(":");
      if (element.length < 2) continue;
      let hostPath = element[0];
      let containerPath = element.slice(1).join(":");

      if (path.isAbsolute(containerPath)) {
        containerPath = path.normalize(containerPath);
      } else {
        containerPath = path.normalize(path.join("/workspace/", containerPath));
      }
      if (path.isAbsolute(hostPath)) {
        hostPath = path.normalize(hostPath);
      } else {
        hostPath = path.normalize(path.join(process.cwd(), hostPath));
      }
      extraBinds.push(`${hostPath}:${containerPath}`);
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
    let containerName = instance.config.docker.containerName;
    if (containerName && (containerName.length > 64 || containerName.length < 2)) {
      throw new Error($t("TXT_CODE_instance.invalidContainerName", { v: containerName }));
    }

    // output startup log
    logger.info("----------------");
    logger.info(`Session ${source}: Request to start an instance`);
    logger.info(`UUID: [${instance.instanceUuid}] [${instance.config.nickname}]`);
    logger.info(`NAME: [${containerName}]`);
    logger.info(`COMMAND: ${commandList.join(" ")}`);
    logger.info(`WORKSPACE: ${cwd}`);
    logger.info(`NET_MODE: ${instance.config.docker.networkMode}`);
    logger.info(`OPEN_PORT: ${JSON.stringify(publicPortArray)}`);
    logger.info(`EXT_MOUNT: ${JSON.stringify(extraBinds)}`);
    logger.info(`NET_ALIASES: ${JSON.stringify(instance.config.docker.networkAliases)}`);
    logger.info(`MEM_LIMIT: ${maxMemory} MB`);
    logger.info(`TYPE: Docker Container`);
    logger.info("----------------");

    // Whether to use TTY mode
    const isTty = instance.config.terminalOption.pty;

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
      User: `${processUserUid()}:${processGroupGid()}`,
      WorkingDir: "/workspace/",
      Cmd: commandList,
      OpenStdin: true,
      StdinOnce: false,
      ExposedPorts: exposedPorts,
      HostConfig: {
        Memory: maxMemory,
        Binds: [`${cwd}:/workspace/`, ...extraBinds],
        AutoRemove: true,
        CpusetCpus: cpusetCpus,
        CpuPeriod: cpuPeriod,
        CpuQuota: cpuQuota,
        PortBindings: publicPortArray,
        NetworkMode: instance.config.docker.networkMode
      },
      NetworkingConfig: {
        EndpointsConfig: {
          [instance.config.docker.networkMode]: {
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

    instance.started(processAdapter);
    logger.info(
      $t("TXT_CODE_instance.successful", {
        v: `${instance.config.nickname} ${instance.instanceUuid}`
      })
    );
  }
}
