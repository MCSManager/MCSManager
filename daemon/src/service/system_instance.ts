import { $t } from "../i18n";
import fs from "fs-extra";
import path from "path";
import os from "os";
import Instance from "../entity/instance/instance";
import EventEmitter from "events";
import KillCommand from "../entity/commands/kill";
import logger from "./log";
import { v4 } from "uuid";
import { Socket } from "socket.io";
import StorageSubsystem from "../common/system_storage";
import InstanceConfig from "../entity/instance/Instance_config";
import { QueryMapWrapper, InstanceStreamListener } from "common";
import FunctionDispatcher from "../entity/commands/dispatcher";
import InstanceControl from "./system_instance_control";
import StartCommand from "../entity/commands/start";
import { globalConfiguration } from "../entity/config";

// init instance default install path
let INSTANCE_DATA_DIR = path.join(process.cwd(), "data/InstanceData");
if (globalConfiguration.config.defaultInstancePath) {
  INSTANCE_DATA_DIR = path.normalize(globalConfiguration.config.defaultInstancePath);
}

if (!fs.existsSync(INSTANCE_DATA_DIR)) {
  fs.mkdirsSync(INSTANCE_DATA_DIR);
}

class InstanceSubsystem extends EventEmitter {
  public readonly GLOBAL_INSTANCE = "__MCSM_GLOBAL_INSTANCE__";
  public readonly GLOBAL_INSTANCE_UUID = "global0001";

  public readonly LOG_DIR = "data/InstanceLog/";

  public readonly instances = new Map<string, Instance>();
  public readonly instanceStream = new InstanceStreamListener();

  constructor() {
    super();
  }

  // start automatically at boot
  private autoStart() {
    this.instances.forEach((instance) => {
      if (instance.config.eventTask.autoStart) {
        instance
          .exec(new StartCommand())
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
      }
    });
  }

  // init all instances from local files
  loadInstances() {
    const instanceConfigs = StorageSubsystem.list("InstanceConfig");
    instanceConfigs.forEach((uuid) => {
      if (uuid === this.GLOBAL_INSTANCE_UUID) return;
      try {
        const instanceConfig = StorageSubsystem.load("InstanceConfig", InstanceConfig, uuid);
        const instance = new Instance(uuid, instanceConfig);

        // Fix BUG, reset state
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

    this.createInstance(
      {
        nickname: this.GLOBAL_INSTANCE,
        cwd: "/",
        startCommand: os.platform() === "win32" ? "cmd.exe" : "bash",
        stopCommand: "^c",
        ie: "utf-8",
        oe: "utf-8",
        type: Instance.TYPE_UNIVERSAL,
        processType: "general"
      },
      false,
      this.GLOBAL_INSTANCE_UUID
    );

    // handle autostart
    this.autoStart();
  }

  createInstance(cfg: any, persistence = true, uuid?: string) {
    const newUuid = uuid || v4().replace(/-/gim, "");
    const instance = new Instance(newUuid, new InstanceConfig());
    // Instance working directory verification and automatic creation
    if (!cfg.cwd || cfg.cwd === ".") {
      cfg.cwd = path.normalize(`${INSTANCE_DATA_DIR}/${instance.instanceUuid}`);
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
      if (deleteFile) fs.remove(instance.config.cwd, (err) => {});
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

  async exit() {
    let promises = [];
    for (const iterator of this.instances) {
      const instance = iterator[1];
      if (instance.status() != Instance.STATUS_STOP) {
        logger.info(
          `Instance ${instance.config.nickname} (${instance.instanceUuid}) is running or busy, and is being forced to end.`
        );
        promises.push(
          instance.execCommand(new KillCommand()).then(() => {
            if (!this.isGlobalInstance(instance))
              StorageSubsystem.store("InstanceConfig", instance.instanceUuid, instance.config);
            logger.info(
              `Instance ${instance.config.nickname} (${instance.instanceUuid}) saved successfully.`
            );
          })
        );
      }
    }
    await Promise.all(promises);
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
