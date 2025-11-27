import EventEmitter from "events";
import fs from "fs-extra";
import { InstanceStreamListener, QueryMapWrapper } from "mcsmanager-common";
import os from "os";
import path from "path";
import { Socket } from "socket.io";
import { v4 } from "uuid";
import StorageSubsystem from "../common/system_storage";
import FunctionDispatcher from "../entity/commands/dispatcher";
import { globalConfiguration } from "../entity/config";
import Instance from "../entity/instance/instance";
import InstanceConfig from "../entity/instance/Instance_config";
import { $t } from "../i18n";
import { sleep } from "../utils/sleep";
import logger from "./log";
import InstanceControl from "./system_instance_control";
import takeoverContainer from "./takeover_container";

class InstanceSubsystem extends EventEmitter {
  public readonly GLOBAL_INSTANCE = "__MCSM_GLOBAL_INSTANCE__";
  public readonly GLOBAL_INSTANCE_UUID = "global0001";

  public readonly LOG_DIR = "data/InstanceLog/";

  public readonly instances = new Map<string, Instance>();
  public readonly instanceStream = new InstanceStreamListener();
  private instanceDataDir = "";

  constructor() {
    super();
    // init instance default install path
    globalConfiguration.load();
    let instanceDataDir = path.join(process.cwd(), "data/InstanceData");
    if (globalConfiguration.config.defaultInstancePath) {
      instanceDataDir = path.normalize(globalConfiguration.config.defaultInstancePath);
    }
    if (!fs.existsSync(instanceDataDir)) fs.mkdirsSync(instanceDataDir);
    this.instanceDataDir = path.normalize(instanceDataDir);
  }

  public getInstanceDataDir() {
    return this.instanceDataDir;
  }

  // start automatically at boot
  private async autoStart() {
    await sleep(1000 * 5);
    for (const instance of this.instances.values()) {
      if (instance.config.eventTask.autoStart && instance.status() == Instance.STATUS_STOP) {
        instance
          .execPreset("start")
          .then(() => {
            logger.info(
              $t("TXT_CODE_system_instance.autoStart", {
                name: instance.config.nickname,
                uuid: instance.instanceUuid
              })
            );
          })
          .catch((reason) => {
            logger.error(
              $t("TXT_CODE_system_instance.autoStartErr", {
                name: instance.config.nickname,
                uuid: instance.instanceUuid,
                reason: reason
              })
            );
          });
        await sleep(1000 * 5);
      }
    }
  }

  // init all instances from local files
  loadInstances() {
    const instanceConfigs = StorageSubsystem.list("InstanceConfig");
    instanceConfigs.forEach((uuid) => {
      if (uuid === this.GLOBAL_INSTANCE_UUID) return;
      try {
        const instanceConfig = StorageSubsystem.load("InstanceConfig", InstanceConfig, uuid);
        const instance = new Instance(uuid, instanceConfig);

        instanceConfig.eventTask.ignore = false;

        // All instances are all function schedulers
        instance
          .forceExec(new FunctionDispatcher())
          .then((v) => {})
          .catch((v) => {});
        this.addInstance(instance);
      } catch (error: any) {
        logger.error(
          $t("TXT_CODE_system_instance.readInstanceFailed", { uuid: uuid, error: error.message })
        );
        logger.error($t("TXT_CODE_system_instance.checkConf", { uuid: uuid }));
      }
    });

    // handle global instance
    let globalConfig: InstanceConfig;
    try {
      globalConfig = StorageSubsystem.load(
        "InstanceConfig",
        InstanceConfig,
        this.GLOBAL_INSTANCE_UUID
      );
      if (globalConfig?.nickname !== this.GLOBAL_INSTANCE)
        throw new Error("Global instance config is not valid");
    } catch (error: any) {
      // if global instance config is not valid, create a new one
      // create default global instance config if not exists
      globalConfig = new InstanceConfig();
      globalConfig.nickname = this.GLOBAL_INSTANCE;
      globalConfig.cwd = "/";
      globalConfig.startCommand = os.platform() === "win32" ? "cmd.exe" : "bash";
      globalConfig.stopCommand = "^c";
      globalConfig.ie = "utf-8";
      globalConfig.oe = "utf-8";
      globalConfig.type = Instance.TYPE_UNIVERSAL;
      globalConfig.processType = "general";

      // save config to file
      StorageSubsystem.store("InstanceConfig", this.GLOBAL_INSTANCE_UUID, globalConfig);
    }

    // create global instance
    this.createInstance(
      {
        nickname: globalConfig.nickname,
        cwd: globalConfig.cwd,
        startCommand: globalConfig.startCommand,
        stopCommand: globalConfig.stopCommand,
        ie: globalConfig.ie,
        oe: globalConfig.oe,
        type: globalConfig.type,
        processType: globalConfig.processType
      },
      true, // allow persistence
      this.GLOBAL_INSTANCE_UUID
    );

    takeoverContainer()
      .catch((error) => {
        const reason = error.message || error;
        if (typeof reason == "string" && reason.includes("connect ENOENT")) {
          return;
        }
        logger.error(`${$t("TXT_CODE_8d4c8f7e")}: ${reason}`);
      })
      .finally(() => this.autoStart());
  }

  createInstance(cfg: any, persistence = true, uuid?: string) {
    const newUuid = uuid || v4().replace(/-/gim, "");
    const instance = new Instance(newUuid, new InstanceConfig());
    // Instance working directory verification and automatic creation
    if (!cfg.cwd || cfg.cwd === ".") {
      cfg.cwd = path.normalize(`${this.instanceDataDir}/${instance.instanceUuid}`);
    }
    if (!fs.existsSync(cfg.cwd)) fs.mkdirsSync(cfg.cwd);
    // Set the default input and output encoding
    cfg.ie = cfg.oe = cfg.fileCode = "utf8";
    // Build and initialize the type from the parameters

    instance.parameters(cfg, persistence);
    instance.forceExec(new FunctionDispatcher());
    this.addInstance(instance);
    return instance;
  }

  addInstance(instance: Instance) {
    if (instance.instanceUuid == null) throw new Error($t("TXT_CODE_system_instance.uuidEmpty"));
    if (this.instances.has(instance.instanceUuid)) {
      throw new Error(`The application instance ${instance.instanceUuid} already exists.`);
    }
    this.instances.set(instance.instanceUuid, instance);
    // Dynamically monitor the newly added instance output stream and pass it to its own event stream
    instance.on("data", (...arr) => {
      this.emit("data", instance.instanceUuid, ...arr);
    });
    instance.on("exit", (...arr) => {
      this.emit(
        "exit",
        {
          instanceUuid: instance.instanceUuid,
          instanceName: instance.config.nickname
        },
        ...arr
      );
    });
    instance.on("open", (...arr) => {
      this.emit(
        "open",
        {
          instanceUuid: instance.instanceUuid,
          instanceName: instance.config.nickname
        },
        ...arr
      );
    });
    instance.on("failure", (...arr) => {
      this.emit(
        "failure",
        {
          instanceUuid: instance.instanceUuid,
          instanceName: instance.config.nickname
        },
        ...arr
      );
    });
  }

  removeInstance(instanceUuid: string, deleteFile: boolean) {
    const instance = this.getInstance(instanceUuid);
    if (instance) {
      if (instance.status() !== Instance.STATUS_STOP) throw new Error($t("TXT_CODE_fb547313"));
      instance.destroy();
      this.instances.delete(instanceUuid);
      StorageSubsystem.delete("InstanceConfig", instanceUuid);
      InstanceControl.deleteInstanceAllTask(instanceUuid);
      if (deleteFile) fs.remove(instance.absoluteCwdPath(), (err) => {});
      return true;
    }
    throw new Error($t("TXT_CODE_3bfb9e04"));
  }

  forward(targetInstanceUuid: string, socket: Socket) {
    try {
      this.instanceStream.requestForward(socket, targetInstanceUuid);
    } catch (err) {}
  }

  stopForward(targetInstanceUuid: string, socket: Socket) {
    try {
      const instance = this.getInstance(targetInstanceUuid);
      if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));
      instance.watchers.delete(socket.id);
      this.instanceStream.cannelForward(socket, targetInstanceUuid);
    } catch (err) {}
  }

  forEachForward(instanceUuid: string, callback: (socket: Socket) => void) {
    this.instanceStream.forwardViaCallback(instanceUuid, (_socket: Socket) => {
      callback(_socket);
    });
  }

  getInstance(instanceUuid: string) {
    return this.instances.get(instanceUuid);
  }

  getQueryMapWrapper() {
    return new QueryMapWrapper(this.instances);
  }

  exists(instanceUuid: string) {
    return this.instances.has(instanceUuid);
  }

  async exitInstance(instance: Instance, force = true) {
    if (!this.isGlobalInstance(instance))
      StorageSubsystem.store("InstanceConfig", instance.instanceUuid, instance.config);
    if (instance.status() === Instance.STATUS_BUSY) {
      logger.info(`Killing ${instance.config.nickname} (${instance.instanceUuid})...`);
      await instance.execPreset("kill");
    } else if (instance.status() !== Instance.STATUS_STOP) {
      if (force) {
        logger.info(`Force stopping ${instance.config.nickname} (${instance.instanceUuid})...`);
        await instance.execPreset("kill");
      } else {
        logger.info(`Stopping ${instance.config.nickname} (${instance.instanceUuid})...`);
        // BUG: Error: write EPIPE
        await instance.execPreset("stop");
      }
    }
  }

  exit(force = false) {
    const promises: Promise<void>[] = [];
    for (const iterator of this.instances) {
      const instance = iterator[1];
      if (instance.status() !== Instance.STATUS_STOP) {
        promises.push(this.exitInstance(instance, force));
      }
    }
    Promise.all(promises);

    return new Promise<void>((resolve) => {
      let checkCount = 0;
      const checkTask = setInterval(() => {
        let count = 0;
        checkCount++;
        for (const [_, instance] of this.instances) {
          if (instance.status() !== Instance.STATUS_STOP) {
            count++;
            if (checkCount > 10) {
              logger.info(
                $t("TXT_CODE_eadac3c2", {
                  instance: instance.config.nickname
                })
              );
              this.exitInstance(instance, true);
            }
          }
        }
        if (count === 0) {
          logger.info($t("TXT_CODE_187bb567"));
          clearInterval(checkTask);
          resolve();
        } else {
          logger.info($t("TXT_CODE_6f23ce93", { count }));
        }
      }, 1000);
    });
  }

  getInstances() {
    let newArr = new Array<Instance>();
    this.instances.forEach((instance) => {
      if (!this.isGlobalInstance(instance)) newArr.push(instance);
    });
    newArr = newArr.sort((a, b) => (a.config.nickname > a.config.nickname ? 1 : -1));
    return newArr;
  }

  isGlobalInstance(instance: Instance) {
    return (
      instance.instanceUuid === this.GLOBAL_INSTANCE_UUID ||
      instance.config.nickname === this.GLOBAL_INSTANCE
    );
  }
}

export default new InstanceSubsystem();
