import { randomUUID } from "crypto";
import { EventEmitter } from "events";
import { t } from "i18next";
import iconv from "iconv-lite";
import { configureEntityParams } from "mcsmanager-common";
import path from "path";
import { CircularBuffer } from "../../common/string_cache";
import StorageSubsystem from "../../common/system_storage";
import { STEAM_CMD_PATH } from "../../const";
import { $t } from "../../i18n";
import javaManager from "../../service/java_manager";
import logger from "../../service/log";
import InstanceCommand from "../commands/base/command";
import { commandStringToArray } from "../commands/base/command_parser";
import FunctionDispatcher, { IPresetCommand } from "../commands/dispatcher";
import { OpenFrp } from "../commands/task/openfrp";
import { globalConfiguration } from "../config";
import InstanceConfig from "./Instance_config";
import { IInstanceProcess } from "./interface";
import { LifeCycleTaskManager } from "./life_cycle";
import { IExecutable, PresetCommandManager } from "./preset";

interface IInstanceInfo {
  mcPingOnline: boolean;
  currentPlayers: number;
  maxPlayers: number;
  version: string;
  fileLock: number;
  playersChart: { value: string }[];
  openFrpStatus: boolean;
  latency: number;
  cpuUsage?: number;
  memoryUsagePercent?: number;
  rxBytes?: number;
  txBytes?: number;
  readBytes?: number;
  writeBytes?: number;
  memoryUsage?: number;
  memoryLimit?: number;
  storageUsage?: number;
  storageLimit?: number;
  allocatedPorts?: { host: number; container: number; protocol: string }[];
}

interface IWatcherInfo {
  terminalSize: {
    w: number;
    h: number;
  };
}

const TERM_TEXT_YELLOW = "\x1B[0;33;1m";
const TERM_TEXT_GOLD = "\x1B[0;33m"; // Gold §6
const TERM_RESET = "\x1B[0m";
const IGNORE_TEXT = [
  "\n\n",
  TERM_TEXT_GOLD,
  "[MCSMANAGER] ",
  TERM_RESET,
  TERM_TEXT_YELLOW,
  t("TXT_CODE_c5ed896f"),
  TERM_RESET,
  "\n\n"
].join("");

export default class Instance extends EventEmitter {
  public static readonly STATUS_BUSY = -1;
  public static readonly STATUS_STOP = 0;
  public static readonly STATUS_STOPPING = 1;
  public static readonly STATUS_STARTING = 2;
  public static readonly STATUS_RUNNING = 3;

  public static readonly TYPE_UNIVERSAL = "universal";
  public static readonly TYPE_MINECRAFT_JAVA = "minecraft/java";
  public static readonly TYPE_MINECRAFT_BEDROCK = "minecraft/bedrock";

  public instanceStatus: number = Instance.STATUS_STOP;
  public instanceUuid: string = "";
  public lock: boolean = false;
  public startCount: number = 0;
  public autoRestartCount: number = 0;
  public startTimestamp: number = 0;
  public asynchronousTask?: IExecutable | null;
  public openFrp?: OpenFrp;

  public readonly lifeCycleTaskManager = new LifeCycleTaskManager(this);
  public readonly presetCommandManager = new PresetCommandManager(this);

  public config: InstanceConfig;

  public info: IInstanceInfo = {
    mcPingOnline: false,
    currentPlayers: 0,
    maxPlayers: 0,
    version: "",
    fileLock: 0,
    playersChart: [],
    openFrpStatus: false,
    latency: 0,
    allocatedPorts: []
  };

  public watchers: Map<string, IWatcherInfo> = new Map();

  public process?: IInstanceProcess;

  private outputLoopTask?: NodeJS.Timeout;
  private outputBuffer = new CircularBuffer<string>(1024);

  // When initializing an instance, the instance must be initialized through uuid and configuration class, otherwise the instance will be unavailable
  constructor(instanceUuid: string, config: InstanceConfig) {
    super();

    if (!instanceUuid || !config) throw new Error($t("TXT_CODE_instanceConf.initInstanceErr"));

    // Basic information
    this.instanceStatus = Instance.STATUS_STOP;
    this.instanceUuid = instanceUuid;

    // Action lock
    this.lock = false;

    this.config = config;

    this.process = undefined;
    this.startCount = 0;
  }

  isStoppedOrBusy() {
    return [Instance.STATUS_STOP, Instance.STATUS_BUSY].includes(this.status());
  }

  // Pass in instance configuration, loosely and dynamically set configuration items for instance parameters
  parameters(cfg: any, persistence = true) {
    // If the instance type changes, default commands and lifecycle events must be reset
    if (cfg?.type && cfg?.type != this.config.type) {
      if (!this.isStoppedOrBusy())
        throw new Error($t("TXT_CODE_instanceConf.cantModifyInstanceType"));
      configureEntityParams(this.config, cfg, "type", String);
      this.forceExec(new FunctionDispatcher());
    }

    if (cfg?.enableRcon != null && cfg?.enableRcon !== this.config.enableRcon) {
      if (!this.isStoppedOrBusy()) throw new Error($t("TXT_CODE_bdfa3457"));
      configureEntityParams(this.config, cfg, "enableRcon", Boolean);
      this.forceExec(new FunctionDispatcher());
    }

    if (cfg?.processType && cfg?.processType !== this.config.processType) {
      if (!this.isStoppedOrBusy())
        throw new Error($t("TXT_CODE_instanceConf.cantModifyProcessType"));
      configureEntityParams(this.config, cfg, "processType", String);
      this.forceExec(new FunctionDispatcher());
    }

    // If the terminal type is changed, the default command must be reset
    if (
      cfg?.terminalOption?.pty != null &&
      cfg?.terminalOption?.pty !== this.config.terminalOption.pty
    ) {
      if (!this.isStoppedOrBusy()) throw new Error($t("TXT_CODE_instanceConf.cantModifyPtyModel"));
      configureEntityParams(this.config.terminalOption, cfg.terminalOption, "pty", Boolean);
      this.forceExec(new FunctionDispatcher());
    }

    // Only allow some configuration items to be modified when the server is stopped
    if (this.isStoppedOrBusy() && cfg.terminalOption) {
      configureEntityParams(this.config.terminalOption, cfg.terminalOption, "ptyWindowCol", Number);
      configureEntityParams(this.config.terminalOption, cfg.terminalOption, "ptyWindowRow", Number);
    }

    if (cfg.tag instanceof Array) {
      cfg.tag = cfg.tag.map((tag: any) => String(tag).trim());
      this.config.tag = cfg.tag;
    }

    if (cfg?.extraServiceConfig) {
      configureEntityParams(
        this.config.extraServiceConfig,
        cfg.extraServiceConfig,
        "isOpenFrp",
        Boolean
      );
      configureEntityParams(
        this.config.extraServiceConfig,
        cfg.extraServiceConfig,
        "openFrpToken",
        String
      );
      configureEntityParams(
        this.config.extraServiceConfig,
        cfg.extraServiceConfig,
        "openFrpTunnelId",
        String
      );
    }

    configureEntityParams(this.config, cfg, "nickname", String);
    configureEntityParams(this.config, cfg, "startCommand", String);
    configureEntityParams(this.config, cfg, "stopCommand", String);
    configureEntityParams(this.config, cfg, "updateCommand", String);
    configureEntityParams(this.config, cfg, "runAs", String);
    configureEntityParams(this.config, cfg, "cwd", String);
    configureEntityParams(this.config, cfg, "ie", String);
    configureEntityParams(this.config, cfg, "oe", String);
    configureEntityParams(this.config, cfg, "crlf", Number);
    configureEntityParams(this.config, cfg, "endTime", Number);
    configureEntityParams(this.config, cfg, "fileCode", String);
    configureEntityParams(this.config, cfg, "rconPassword", String);
    configureEntityParams(this.config, cfg, "rconPort", Number);
    configureEntityParams(this.config, cfg, "rconIp", String);
    configureEntityParams(this.config, cfg, "category", Number);
    configureEntityParams(this.config, cfg, "basePort", Number);

    if (cfg.docker) {
      configureEntityParams(this.config.docker, cfg.docker, "containerName", String);
      configureEntityParams(this.config.docker, cfg.docker, "image", String);
      configureEntityParams(this.config.docker, cfg.docker, "memory", Number);
      configureEntityParams(this.config.docker, cfg.docker, "ports");
      configureEntityParams(this.config.docker, cfg.docker, "extraVolumes");
      configureEntityParams(this.config.docker, cfg.docker, "maxSpace", Number);
      configureEntityParams(this.config.docker, cfg.docker, "io", Number);
      configureEntityParams(this.config.docker, cfg.docker, "network", Number);
      configureEntityParams(this.config.docker, cfg.docker, "networkMode", String);
      configureEntityParams(this.config.docker, cfg.docker, "networkAliases");
      configureEntityParams(this.config.docker, cfg.docker, "cpusetCpus", String);
      configureEntityParams(this.config.docker, cfg.docker, "cpuUsage", Number);
      configureEntityParams(this.config.docker, cfg.docker, "env");
      configureEntityParams(this.config.docker, cfg.docker, "labels");
      configureEntityParams(this.config.docker, cfg.docker, "workingDir", String);
      configureEntityParams(this.config.docker, cfg.docker, "changeWorkdir", Boolean);
      configureEntityParams(this.config.docker, cfg.docker, "memorySwappiness", Number);
      configureEntityParams(this.config.docker, cfg.docker, "memorySwap", Number);
      configureEntityParams(this.config.docker, cfg.docker, "capAdd");
      configureEntityParams(this.config.docker, cfg.docker, "capDrop");
      configureEntityParams(this.config.docker, cfg.docker, "devices");
      configureEntityParams(this.config.docker, cfg.docker, "privileged", Boolean);
    }
    if (cfg.pingConfig) {
      configureEntityParams(this.config.pingConfig, cfg.pingConfig, "ip", String);
      configureEntityParams(this.config.pingConfig, cfg.pingConfig, "port", Number);
      configureEntityParams(this.config.pingConfig, cfg.pingConfig, "type", Number);
    }
    if (cfg.eventTask) {
      configureEntityParams(this.config.eventTask, cfg.eventTask, "autoStart", Boolean);
      configureEntityParams(this.config.eventTask, cfg.eventTask, "autoRestart", Boolean);
      configureEntityParams(this.config.eventTask, cfg.eventTask, "autoRestartMaxTimes", Number);
      configureEntityParams(this.config.eventTask, cfg.eventTask, "ignore", Boolean);
    }
    if (cfg.terminalOption) {
      configureEntityParams(this.config.terminalOption, cfg.terminalOption, "haveColor", Boolean);
    }

    if (cfg.startCommand && commandStringToArray(cfg.startCommand)[0] != "{mcsm_java}") {
      this.config.java.id = "";
    } else if (cfg.java) {
      configureEntityParams(this.config.java, cfg.java, "id", String);
    }

    if (persistence) {
      if (!this.config.basePort) this.allocatePort(this.config);
      StorageSubsystem.store("InstanceConfig", this.instanceUuid, this.config);
    }
  }

  allocatePort(cfg: InstanceConfig) {
    const globalCfg = globalConfiguration.config;
    const [minPort, maxPort] = globalCfg.allocatablePortRange;

    cfg.basePort = globalCfg.currentAllocatablePort;
    globalCfg.currentAllocatablePort += globalCfg.portAssignInterval;

    if (globalCfg.currentAllocatablePort > maxPort) {
      globalCfg.currentAllocatablePort = minPort;
    }

    // Avoid port overlap with Daemon.
    if (
      cfg.basePort <= globalCfg.port &&
      cfg.basePort + globalCfg.portAssignInterval >= globalCfg.port
    ) {
      cfg.basePort = globalCfg.port + 1;
      globalCfg.currentAllocatablePort = cfg.basePort + globalCfg.portAssignInterval;
    }

    globalConfiguration.store();
  }

  resetConfigWithoutDocker() {
    const newDockerCfg: IGlobalInstanceConfig["docker"] = JSON.parse(
      JSON.stringify(this.config.docker)
    );

    const extendDockerCfg = newDockerCfg as any;

    if (!extendDockerCfg?.isResetDockerCfg) {
      // Delete some environment configurations specific to a certain image
      // to avoid the newly generated configurations from having an adverse impact on new images.
      delete newDockerCfg.image;
      delete newDockerCfg.env;
      delete newDockerCfg.ports;
      delete newDockerCfg.workingDir;
      delete newDockerCfg.changeWorkdir;
      delete newDockerCfg.containerName;

      // Reset some configurations
      this.config.updateCommand = "";
      this.config.startCommand = "";
      this.config.stopCommand = "^C";
      this.config.type = Instance.TYPE_UNIVERSAL;
    }

    this.config.docker = newDockerCfg;
  }

  setLock(bool: boolean) {
    if (this.lock === true && bool === true) {
      throw new Error($t("TXT_CODE_ca030197"));
    }
    this.lock = bool;
  }

  // force the command to execute
  async forceExec(command: InstanceCommand) {
    return await command.exec(this);
  }

  // set instance state or get state
  status(v?: number) {
    if (v != null) this.instanceStatus = v;
    return this.instanceStatus;
  }

  // function that must be executed after the instance starts
  // Trigger the open event and bind the data and exit events, etc.
  started(process: IInstanceProcess) {
    this.config.lastDatetime = Date.now();
    const outputCode = this.config.terminalOption.pty ? "utf-8" : this.config.oe;
    process.on("data", (text: any) => {
      this.pushOutput(iconv.decode(text, outputCode));
    });
    process.on("exit", (code: number) => this.stopped(code));
    this.process = process;
    this.instanceStatus = Instance.STATUS_RUNNING;
    this.emit("open", this);

    // start all lifecycle tasks
    this.lifeCycleTaskManager.execLifeCycleTask(1);
    this.startOutputLoop();
  }

  // If the instance performs any operation exception, it must throw an exception through this function
  // trigger failure event
  failure(error: Error) {
    this.emit("failure", error);
    this.println("ERROR", error.message ?? String(error));
    throw error;
  }

  // function that must be executed after the instance has been closed
  // trigger exit event
  stopped(code = 0) {
    // Close all lifecycle tasks
    this.stopOutputLoop();
    this.println("INFO", $t("TXT_CODE_70ce6fbb"));
    this.releaseResources();
    if (this.instanceStatus != Instance.STATUS_STOP) {
      this.instanceStatus = Instance.STATUS_STOP;
      this.startTimestamp = 0;
      this.emit("exit", code);
      StorageSubsystem.store("InstanceConfig", this.instanceUuid, this.config);
    }

    this.lifeCycleTaskManager.execLifeCycleTask(0);

    // If automatic restart is enabled, the startup operation is performed immediately
    if (!this.config.eventTask.ignore && this.config.eventTask.autoRestart) {
      const maxAutoRestartCount = this.config.eventTask.autoRestartMaxTimes;
      if (maxAutoRestartCount == -1 || this.autoRestartCount < maxAutoRestartCount) {
        this.execPreset("start")
          .then(() => {
            this.autoRestartCount++;
            this.println($t("TXT_CODE_instanceConf.info"), $t("TXT_CODE_instanceConf.autoRestart"));
          })
          .catch((err) => {
            this.println(
              $t("TXT_CODE_instanceConf.error"),
              $t("TXT_CODE_instanceConf.autoRestartErr", { err: err })
            );
          });
      } else {
        this.println($t("TXT_CODE_instanceConf.error"), $t("TXT_CODE_894b8e52"));
      }
    }

    this.config.eventTask.ignore = false;

    // Turn off the warning immediately after startup, usually the startup command is written incorrectly
    const currentTimestamp = new Date().getTime();
    const startThreshold = 2 * 1000;
    if (currentTimestamp - this.startTimestamp < startThreshold) {
      this.println("ERROR", $t("TXT_CODE_aae2918f"));
    }
  }

  ignoreEventTaskOnce() {
    if (this.config.eventTask) this.config.eventTask.ignore = true;
  }

  // custom output method, formatting
  println(level: string, text: string) {
    const str = `[${level}] ${text}\n`;
    this.emit("data", str);
  }

  // custom output method
  print(data: any) {
    this.emit("data", data);
  }

  // Release resources (mainly release process-related resources)
  releaseResources() {
    try {
      this.process?.destroy();
    } catch (error: any) {
      logger.error(`Instance ${this.instanceUuid}, Release resources error: ${error}`);
    } finally {
      this.process = undefined;
    }
    this.resetInstanceRuntimeInfo();
  }

  resetInstanceRuntimeInfo() {
    this.info = {
      mcPingOnline: false,
      currentPlayers: 0,
      maxPlayers: 0,
      version: "",
      fileLock: 0,
      playersChart: [],
      openFrpStatus: false,
      latency: 0,
      allocatedPorts: this.info.allocatedPorts ?? []
    };
  }

  // destroy this instance
  destroy() {
    if (this.process && this.process.pid) {
      this.process.kill("SIGKILL");
    }
    this.process = undefined;
  }

  fullTime() {
    const date = new Date();
    return date.toLocaleDateString() + " " + date.getHours() + ":" + date.getMinutes();
  }

  hasCwdPath() {
    return !!this.config.cwd;
  }

  absoluteCwdPath() {
    if (!this.config || !this.config.cwd) throw new Error("Instance config error, cwd is Null!");
    if (path.isAbsolute(this.config.cwd)) return path.normalize(this.config.cwd);
    return path.normalize(path.join(process.cwd(), this.config.cwd));
  }

  // execute the preset command action
  async execPreset(action: IPresetCommand, p?: any) {
    if (this.presetCommandManager) {
      return await this.presetCommandManager.execPreset(action, p);
    }
    throw new Error(`Preset Manager does not exist`);
  }

  setPreset(action: IPresetCommand, cmd: InstanceCommand) {
    this.presetCommandManager.setPreset(action, cmd);
  }

  getPreset(action: IPresetCommand) {
    return this.presetCommandManager.getPreset(action);
  }

  clearPreset() {
    this.presetCommandManager.clearPreset();
  }

  computeTerminalSize() {
    let minW = this.config.terminalOption.ptyWindowCol;
    let minH = this.config.terminalOption.ptyWindowRow;
    for (const iterator of this.watchers.values()) {
      const { w, h } = iterator.terminalSize;
      if (w && h) {
        if (w < minW) minW = w;
        if (h < minH) minH = h;
      }
    }
    return {
      w: minW,
      h: minH
    };
  }

  public resetPingInfo() {
    this.info.mcPingOnline = false;
    this.info.currentPlayers = 0;
    this.info.maxPlayers = 0;
    this.info.version = "";

    this.info.latency = 0;
  }

  public async parseTextParams(text: string) {
    if (typeof text !== "string") return "";
    text = text.replace(/\{mcsm_workspace\}/gim, this.absoluteCwdPath());
    text = text.replace(/\{mcsm_cwd\}/gim, this.absoluteCwdPath());
    text = text.replace(/\{mcsm_uuid\}/gim, this.instanceUuid);
    text = text.replace(/\{mcsm_random\}/gim, randomUUID());
    text = text.replace(/\{mcsm_run_as\}/gim, this.config.runAs);
    text = text.replace(/\{mcsm_steamcmd\}/gim, STEAM_CMD_PATH);
    text = text.replace(/\{mcsm_instance_id\}/gim, this.instanceUuid);
    text = text.replace(/\{mcsm_instance_name\}/gim, this.config.nickname);
    text = text.replace(/\{mcsm_instance_base_port\}/gim, String(this.config.basePort));

    const javaId = this.config.java.id;
    if (javaId) {
      text = text.replace(/\{mcsm_java\}/gim, await javaManager.getJavaRuntimeCommand(javaId));
    }

    const ports = Array.from(
      { length: globalConfiguration.config.portAssignInterval || 1 },
      (_, index) => index + 1
    );
    const basePort = Number(this.config.basePort);
    ports.forEach((portOffset) => {
      const placeholder = `\\{mcsm_port${portOffset}\\}`;
      const replacement = String(basePort + portOffset);
      text = text.replace(new RegExp(placeholder, "gim"), replacement);
    });
    return text;
  }

  public getCrlfValue(): string {
    return this.config.crlf === 2 ? "\r\n" : "\n";
  }

  public generateEnv() {
    let env = process.env;
    if (this.config.runAs) {
      env = {
        ...env,
        USER: this.config.runAs ?? "",
        HOME: this.config.runAs ? `/home/${this.config.runAs}` : "",
        LOGNAME: this.config.runAs ?? ""
      };
    }
    return env;
  }

  private pushOutput(data: string) {
    this.outputBuffer.pushLog(data);
  }

  private flushOutputBuffer(shouldClear = false) {
    const { items, wasDeleted } = this.outputBuffer.getCache();
    if (!items.length) return;
    if (wasDeleted) items.unshift(IGNORE_TEXT);
    if (shouldClear) this.outputBuffer.clear();
    this.emit("data", items.join(""));
  }

  private startOutputLoop() {
    this.outputLoopTask = setInterval(() => {
      this.flushOutputBuffer();
    }, 50);
  }

  private stopOutputLoop() {
    if (this.outputLoopTask) clearInterval(this.outputLoopTask);
    this.outputLoopTask = undefined;
    this.flushOutputBuffer(true);
  }
}
