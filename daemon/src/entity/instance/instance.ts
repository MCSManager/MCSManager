import { $t } from "../../i18n";
import iconv from "iconv-lite";
import path from "path";
import { EventEmitter } from "events";
import { IExecutable } from "./preset";
import InstanceCommand from "../commands/base/command";
import InstanceConfig from "./Instance_config";
import StorageSubsystem from "../../common/system_storage";
import { LifeCycleTaskManager } from "./life_cycle";
import { PresetCommandManager } from "./preset";
import FunctionDispatcher, { IPresetCommand } from "../commands/dispatcher";
import { IInstanceProcess } from "./interface";
import StartCommand from "../commands/start";
import { configureEntityParams } from "common";
import { OpenFrp } from "../commands/task/openfrp";
import logger from "../../service/log";

// The instance does not need to store additional information persistently
interface IInstanceInfo {
  currentPlayers: number;
  maxPlayers: number;
  version: string;
  fileLock: number;
  playersChart: Array<{ value: string }>;
  openFrpStatus: boolean;
}

interface IWatcherInfo {
  terminalSize: {
    w: number;
    h: number;
  };
}

// instance class
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
  public startTimestamp: number = 0;
  public asynchronousTask?: IExecutable | null;
  public openFrp?: OpenFrp;

  public readonly lifeCycleTaskManager = new LifeCycleTaskManager(this);
  public readonly presetCommandManager = new PresetCommandManager(this);

  public config: InstanceConfig;

  public info: IInstanceInfo = {
    currentPlayers: -1,
    maxPlayers: -1,
    version: "",
    fileLock: 0,
    playersChart: [],
    openFrpStatus: false
  };

  public watchers: Map<string, IWatcherInfo> = new Map();

  public process?: IInstanceProcess;

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
    configureEntityParams(this.config, cfg, "cwd", String);
    configureEntityParams(this.config, cfg, "ie", String);
    configureEntityParams(this.config, cfg, "oe", String);
    configureEntityParams(this.config, cfg, "crlf", Number);
    configureEntityParams(this.config, cfg, "endTime", Number);
    configureEntityParams(this.config, cfg, "fileCode", String);
    configureEntityParams(this.config, cfg, "rconPassword", String);
    configureEntityParams(this.config, cfg, "rconPort", Number);
    configureEntityParams(this.config, cfg, "rconIp", String);

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
      configureEntityParams(this.config.docker, cfg.docker, "workingDir", String);
    }
    if (cfg.pingConfig) {
      configureEntityParams(this.config.pingConfig, cfg.pingConfig, "ip", String);
      configureEntityParams(this.config.pingConfig, cfg.pingConfig, "port", Number);
      configureEntityParams(this.config.pingConfig, cfg.pingConfig, "type", Number);
    }
    if (cfg.eventTask) {
      configureEntityParams(this.config.eventTask, cfg.eventTask, "autoStart", Boolean);
      configureEntityParams(this.config.eventTask, cfg.eventTask, "autoRestart", Boolean);
      configureEntityParams(this.config.eventTask, cfg.eventTask, "ignore", Boolean);
    }
    if (cfg.terminalOption) {
      configureEntityParams(this.config.terminalOption, cfg.terminalOption, "haveColor", Boolean);
    }

    if (persistence) StorageSubsystem.store("InstanceConfig", this.instanceUuid, this.config);
  }

  setLock(bool: boolean) {
    this.lock = bool;
  }

  // Execute the corresponding command for this instance
  async execCommand(command: InstanceCommand) {
    if (this.lock)
      throw new Error($t("TXT_CODE_instanceConf.instanceLock", { info: command.info }));
    if (this.status() == Instance.STATUS_BUSY)
      throw new Error($t("TXT_CODE_instanceConf.instanceBusy"));
    return await command.exec(this);
  }

  // Execute the corresponding command for this instance Alias
  async exec(command: InstanceCommand) {
    return await this.execCommand(command);
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
      this.emit("data", iconv.decode(text, outputCode));
    });
    process.on("exit", (code: number) => this.stopped(code));
    this.process = process;
    this.instanceStatus = Instance.STATUS_RUNNING;
    this.emit("open", this);
    // start all lifecycle tasks
    this.lifeCycleTaskManager.execLifeCycleTask(1);
  }

  // If the instance performs any operation exception, it must throw an exception through this function
  // trigger failure event
  failure(error: Error) {
    this.emit("failure", error);
    this.println("Operation Error", error.message ?? String(error));
    throw error;
  }

  // function that must be executed after the instance has been closed
  // trigger exit event
  stopped(code = 0) {
    this.releaseResources();
    if (this.instanceStatus != Instance.STATUS_STOP) {
      this.instanceStatus = Instance.STATUS_STOP;
      this.emit("exit", code);
      StorageSubsystem.store("InstanceConfig", this.instanceUuid, this.config);
    }
    // Close all lifecycle tasks
    this.lifeCycleTaskManager.execLifeCycleTask(0);

    // If automatic restart is enabled, the startup operation is performed immediately
    if (this.config.eventTask.autoRestart) {
      if (!this.config.eventTask.ignore) {
        this.forceExec(new StartCommand("Event Task: Auto Restart"))
          .then(() => {
            this.println($t("TXT_CODE_instanceConf.info"), $t("TXT_CODE_instanceConf.autoRestart"));
          })
          .catch((err) => {
            this.println(
              $t("TXT_CODE_instanceConf.error"),
              $t("TXT_CODE_instanceConf.autoRestartErr", { err: err })
            );
          });
      }
      this.config.eventTask.ignore = false;
    }

    // Turn off the warning immediately after startup, usually the startup command is written incorrectly
    const currentTimestamp = new Date().getTime();
    const startThreshold = 6 * 1000;
    if (currentTimestamp - this.startTimestamp < startThreshold) {
      this.println("ERROR", $t("TXT_CODE_instanceConf.instantExit"));
    }
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

  absoluteCwdPath() {
    if (!this.config || !this.config.cwd) throw new Error("Instance config error, cwd is Null!");
    if (path.isAbsolute(this.config.cwd)) return path.normalize(this.config.cwd);
    return path.normalize(path.join(process.cwd(), this.config.cwd));
  }

  async usedSpace(tmp?: string, maxDeep = 4, deep = 0) {
    // if (deep >= maxDeep) return 0;
    // let size = 0;
    // const topPath = tmp ? tmp : this.absoluteCwdPath();
    // const files = await fs.readdir(topPath);
    // for (const fileName of files) {
    // const absPath = path.join(topPath, fileName);
    // const info = await fs.stat(absPath);
    // if (info.isDirectory()) {
    // size += await this.usedSpace(absPath, maxDeep, deep + 1);
    // } else {
    // size += info.size;
    // }
    // }
    return 0;
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
}
