// Copyright (C) 2022 MCSManager Team <mcsmanager-dev@outlook.com>

import { logger } from "./log";
import { IRemoteService, RemoteServiceConfig } from "../entity/entity_interface";
import RemoteService from "../entity/remote_service";
import { UniversalRemoteSubsystem } from "./base/urs";
import StorageSubsystem from "../common/system_storage";
import fs from "fs-extra";
import path from "path";
import { $t } from "../i18n";

// 远程服务管理子系统（RemoteServiceSubsystem）这个子系统将是最重要的系统之一
// 主要功能是在所有地方存储远程服务
// 扫描本地服务，统一管理，远程调用和代理等
class RemoteServiceSubsystem extends UniversalRemoteSubsystem<RemoteService> {
  constructor() {
    super();
    // If it is the first startup, it will automatically try to connect to "LocalHost",
    // otherwise it will automatically read from the configuration file and connect to all remote services.
    StorageSubsystem.list("RemoteServiceConfig").forEach((uuid) => {
      const config = StorageSubsystem.load(
        "RemoteServiceConfig",
        RemoteServiceConfig,
        uuid
      ) as RemoteServiceConfig;
      const newService = new RemoteService(uuid, config);
      this.setInstance(uuid, newService);
      newService.connect();
    });

    // 若无任何守护进程，则检测本地是否存在守护进程
    if (this.services.size === 0) {
      this.initConnectLocalhost("");
    }

    logger.info($t("systemRemoteService.nodeCount", { n: this.services.size }));

    // 注册定期连接状态检查
    setInterval(() => this.connectionStatusCheckTask(), 1000 * 60);
  }

  // Register a NEW remote service to system and connect it.
  // Like: this.registerRemoteService({
  //   ip: "127.0.0.1",
  //   apiKey: "test_key",
  //   port: 24444
  // });
  registerRemoteService(config: IRemoteService) {
    const instance = this.newInstance(config);
    StorageSubsystem.store("RemoteServiceConfig", instance.uuid, instance.config);
    instance.connect();
    return instance;
  }

  // 根据 UUID 删除指定的远程服务
  deleteRemoteService(uuid: string) {
    if (this.getInstance(uuid)) {
      this.getInstance(uuid).disconnect();
      this.deleteInstance(uuid);
      StorageSubsystem.delete("RemoteServiceConfig", uuid);
    }
  }

  // According to the IRemoteService, New a RemoteService object
  // Used to initialize objects.
  newInstance(config: IRemoteService) {
    const instance = new RemoteService(
      config.uuid || this.randdomUuid(),
      new RemoteServiceConfig()
    );
    this.setInstance(instance.uuid, instance);
    this.edit(instance.uuid, config);
    return instance;
  }

  // Edit the configuration file of the instance
  edit(uuid: string, config: IRemoteService) {
    const instance = this.getInstance(uuid);
    if (config.remarks) instance.config.remarks = config.remarks;
    if (config.ip) instance.config.ip = config.ip;
    if (config.port) instance.config.port = config.port;
    if (config.apiKey) instance.config.apiKey = config.apiKey;
    StorageSubsystem.store("RemoteServiceConfig", instance.uuid, instance.config);
  }

  // Scannce localhost service
  // First use, need to scan the local host
  // Note: Every time you execute "initConnectLocalhost",
  // it will be managed by the subsystem (regardless of whether the target exists).
  async initConnectLocalhost(key?: string) {
    const ip = "localhost";
    const localKeyFilePath = path.normalize(
      path.join(process.cwd(), "../daemon/data/Config/global.json")
    );
    logger.info($t("systemRemoteService.loadDaemonTitle", { localKeyFilePath }));
    if (fs.existsSync(localKeyFilePath)) {
      logger.info($t("systemRemoteService.autoCheckDaemon"));
      const localDaemonConfig = JSON.parse(
        fs.readFileSync(localKeyFilePath, { encoding: "utf-8" })
      );
      const localKey = localDaemonConfig.key;
      const localPort = localDaemonConfig.port;
      return this.registerRemoteService({ apiKey: localKey, port: localPort, ip });
    } else if (key) {
      const port = 24444;
      return this.registerRemoteService({ apiKey: key, port, ip });
    }
    logger.warn($t("systemRemoteService.error"));

    // 5秒后判断是否已经连上守护进程，直到有一个守护进程连上
    setTimeout(() => {
      if (this.services.size === 0) return this.initConnectLocalhost();
    }, 5 * 1000);
  }

  count() {
    let total = 0;
    let available = 0;
    this.services.forEach((v) => {
      total++;
      if (v.available) available++;
    });
    return { available, total };
  }

  // 定期连接状态检查
  connectionStatusCheckTask() {
    this.services?.forEach((v) => {
      if (v && v.available === false) {
        logger.warn(
          `Daemon exception detected: ${v.config.remarks} ${v.config.ip}:${v.config.port}, reconnecting...`
        );
        return v.connect();
      }
    });
  }
}

export default new RemoteServiceSubsystem();
