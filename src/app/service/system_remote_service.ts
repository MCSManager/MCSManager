/*
  Copyright (C) 2022 Suwings <Suwings@outlook.com>

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  
  According to the AGPL, it is forbidden to delete all copyright notices, 
  and if you modify the source code, you must open source the
  modified source code.

  版权所有 (C) 2022 Suwings <Suwings@outlook.com>

  该程序是免费软件，您可以重新分发和/或修改据 GNU Affero 通用公共许可证的条款，
  由自由软件基金会，许可证的第 3 版，或（由您选择）任何更高版本。

  根据 AGPL 与用户协议，您必须保留所有版权声明，如果修改源代码则必须开源修改后的源代码。
  可以前往 https://mcsmanager.com/ 阅读用户协议，申请闭源开发授权等。
*/

import { logger } from "./log";
import { IRemoteService, RemoteServiceConfig } from "../entity/entity_interface";
import RemoteService from "../entity/remote_service";
import { UniversalRemoteSubsystem } from "./base/urs";
import StorageSubsystem from "../common/system_storage";
import fs from "fs-extra";
import path from "path";

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

    logger.info(`远程服务子系统初始化完毕`);
    logger.info(`总计配置节点数: ${this.services.size}`);
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
    logger.info(`正在尝试读取本地守护进程: ${localKeyFilePath}`);
    if (fs.existsSync(localKeyFilePath)) {
      logger.info("检测到本地守护进程，正在自动获取密钥和端口...");
      const localDaemonConfig = JSON.parse(
        fs.readFileSync(localKeyFilePath, { encoding: "utf-8" })
      );
      const localKey = localDaemonConfig.key;
      const localPort = localDaemonConfig.port;
      logger.info("正在自动连接本地守护进程...");
      return this.registerRemoteService({ apiKey: localKey, port: localPort, ip });
    } else if (key) {
      const port = 24444;
      logger.info("无法自动获取本地守护进程配置文件，已发起连接但可能未经证实...");
      return this.registerRemoteService({ apiKey: key, port, ip });
    }
    logger.info("无法自动获取本地守护进程配置文件，请手动连接守护进程");
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
}

export default new RemoteServiceSubsystem();
