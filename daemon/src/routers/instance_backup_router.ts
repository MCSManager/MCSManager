import { $t } from "../i18n";
import logger from "../service/log";
import * as protocol from "../service/protocol";
import { routerApp } from "../service/router";
import InstanceSubsystem from "../service/system_instance";
import InstanceBackupService from "../service/instance_backup";
import Instance from "../entity/instance/instance";

// 备份功能路由认证中间件
routerApp.use((event, ctx, data, next) => {
  if (event.startsWith("instance/backup")) {
    const instanceUuid = data.instanceUuid;
    if (!InstanceSubsystem.exists(instanceUuid)) {
      return protocol.error(ctx, event, {
        instanceUuid: instanceUuid,
        err: `The operation failed, the instance ${instanceUuid} does not exist.`
      });
    }
  }
  next();
});

// 创建备份
routerApp.on("instance/backup/create", async (ctx, data) => {
  const instanceUuid = data.instanceUuid;
  try {
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));

    // 检查实例是否正在运行，建议停止后再备份
    if (instance.status() === Instance.STATUS_RUNNING) {
      logger.warn(
        `[Backup] Creating backup for running instance ${instanceUuid}, this may cause issues`
      );
    }

    logger.info(
      `[Backup] User ${ctx.socket.id} requested backup creation for instance ${instanceUuid}`
    );

    const backupInfo = await InstanceBackupService.createBackup(instance);

    protocol.msg(ctx, "instance/backup/create", {
      instanceUuid,
      backup: backupInfo
    });
  } catch (err: any) {
    logger.error(
      `[Backup] Failed to create backup for instance ${instanceUuid}:`,
      err
    );
    protocol.error(ctx, "instance/backup/create", {
      instanceUuid: instanceUuid,
      err: err.message
    });
  }
});

// 列出备份
routerApp.on("instance/backup/list", async (ctx, data) => {
  const instanceUuid = data.instanceUuid;
  try {
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));

    const backups = await InstanceBackupService.listBackups(instance);

    protocol.msg(ctx, "instance/backup/list", {
      instanceUuid,
      backups
    });
  } catch (err: any) {
    logger.error(
      `[Backup] Failed to list backups for instance ${instanceUuid}:`,
      err
    );
    protocol.error(ctx, "instance/backup/list", {
      instanceUuid: instanceUuid,
      err: err.message
    });
  }
});

// 删除备份
routerApp.on("instance/backup/delete", async (ctx, data) => {
  const instanceUuid = data.instanceUuid;
  const fileName = data.fileName;
  try {
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));

    if (!fileName) {
      throw new Error($t("TXT_CODE_instance_backup.fileNameRequired"));
    }

    logger.info(
      `[Backup] User ${ctx.socket.id} requested deletion of backup ${fileName} for instance ${instanceUuid}`
    );

    await InstanceBackupService.deleteBackup(instance, fileName);

    protocol.msg(ctx, "instance/backup/delete", {
      instanceUuid,
      fileName
    });
  } catch (err: any) {
    logger.error(
      `[Backup] Failed to delete backup ${fileName} for instance ${instanceUuid}:`,
      err
    );
    protocol.error(ctx, "instance/backup/delete", {
      instanceUuid: instanceUuid,
      fileName: fileName,
      err: err.message
    });
  }
});

// 获取备份下载路径
routerApp.on("instance/backup/download", async (ctx, data) => {
  const instanceUuid = data.instanceUuid;
  const fileName = data.fileName;
  try {
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));

    // 检查是否允许下载
    if (!instance.config.backupConfig?.enableDownload) {
      throw new Error($t("TXT_CODE_instance_backup.downloadDisabled"));
    }

    if (!fileName) {
      throw new Error($t("TXT_CODE_instance_backup.fileNameRequired"));
    }

    const backupPath = InstanceBackupService.getBackupPath(instance, fileName);

    logger.info(
      `[Backup] User ${ctx.socket.id} requested download path for backup ${fileName} of instance ${instanceUuid}`
    );

    protocol.msg(ctx, "instance/backup/download", {
      instanceUuid,
      fileName,
      path: backupPath
    });
  } catch (err: any) {
    logger.error(
      `[Backup] Failed to get download path for backup ${fileName} of instance ${instanceUuid}:`,
      err
    );
    protocol.error(ctx, "instance/backup/download", {
      instanceUuid: instanceUuid,
      fileName: fileName,
      err: err.message
    });
  }
});

// 恢复备份
routerApp.on("instance/backup/restore", async (ctx, data) => {
  const instanceUuid = data.instanceUuid;
  const fileName = data.fileName;
  try {
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));

    // 检查实例是否正在运行
    if (instance.status() !== Instance.STATUS_STOP) {
      throw new Error($t("TXT_CODE_instance_backup.mustStopBeforeRestore"));
    }

    if (!fileName) {
      throw new Error($t("TXT_CODE_instance_backup.fileNameRequired"));
    }

    logger.info(
      `[Backup] User ${ctx.socket.id} requested restore of backup ${fileName} for instance ${instanceUuid}`
    );

    await InstanceBackupService.restoreBackup(instance, fileName);

    protocol.msg(ctx, "instance/backup/restore", {
      instanceUuid,
      fileName
    });
  } catch (err: any) {
    logger.error(
      `[Backup] Failed to restore backup ${fileName} for instance ${instanceUuid}:`,
      err
    );
    protocol.error(ctx, "instance/backup/restore", {
      instanceUuid: instanceUuid,
      fileName: fileName,
      err: err.message
    });
  }
});

logger.info("[Backup] Instance backup router initialized");
