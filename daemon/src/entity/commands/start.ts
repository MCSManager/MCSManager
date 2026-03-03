import fs from "fs-extra";
import { $t } from "../../i18n";
import disk_limit_service from "../../service/disk_limit_service";
import Instance from "../instance/instance";
import InstanceCommand from "./base/command";

export class StartupError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

export default abstract class AbsStartCommand extends InstanceCommand {
  private async sleep() {
    return new Promise((ok) => {
      setTimeout(ok, 1000 * 2);
    });
  }

  async exec(instance: Instance) {
    if (instance.status() !== Instance.STATUS_STOP)
      return instance.failure(new StartupError($t("TXT_CODE_start.instanceNotDown")));

    // Create the instance directory if it doesn't exist
    if (!fs.existsSync(instance.absoluteCwdPath())) {
      await fs.mkdirs(instance.absoluteCwdPath());
    }

    try {
      instance.setLock(true);
      instance.status(Instance.STATUS_STARTING);
      instance.startCount++;

      instance.startTimestamp = Date.now();

      if (instance.config.endTime) {
        const endTime = instance.config.endTime;
        if (endTime) {
          if (endTime <= instance.startTimestamp) {
            throw new Error($t("TXT_CODE_start.instanceMaturity"));
          }
        }
      }

      instance.println("INFO", $t("TXT_CODE_start.startInstance"));

      // prevent the dead-loop from starting
      await this.sleep();

      // check the disk space
      if (instance.config.docker?.maxSpace && instance.config.docker.maxSpace > 0) {
        instance.println("INFO", $t("正在计算已使用的储存空间，请耐心等待..."));
        const result = await disk_limit_service.checkDiskNow(
          {
            instance,
            workspace: instance.absoluteCwdPath(),
            maxSpace: instance.config.docker.maxSpace
          },
          false
        );
        if (result?.isFull) {
          throw new StartupError(
            $t(
              "无法启动！储存空间不足，您的储存额度为 {{storageLimit}}GB，当前已使用 {{storageUsage}}GB",
              {
                storageLimit: result?.storageLimit,
                storageUsage: result?.storageUsage
              }
            )
          );
        } else {
          instance.println(
            "INFO",
            $t("储存空间充足，当前已使用 {{storageUsage}}GB/{{storageLimit}}GB", {
              storageUsage: result?.storageUsage,
              storageLimit: result?.storageLimit
            })
          );
        }
      }

      return await this.createProcess(instance);
    } catch (error: any) {
      instance.execPreset("kill");
      instance.releaseResources();
      instance.status(Instance.STATUS_STOP);
      instance.failure(error);
    } finally {
      instance.setLock(false);
    }
  }

  protected abstract createProcess(instance: Instance): Promise<void>;
}
