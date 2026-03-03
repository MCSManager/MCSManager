import { exec } from "node:child_process";
import fs from "node:fs";
import { promisify } from "util";
import Instance from "../entity/instance/instance";
import { $t } from "../i18n";
import { ConsumerQueue } from "../utils/queue";
import { sleep } from "../utils/sleep";

const execPromise = promisify(exec);

interface IDiskLimitItem {
  instance: Instance;
  workspace: string;
  maxSpace: number;
}

// du -s --block-size=1M /docker-volumes/app1-logs | cut -f1
class DiskLimitService {
  private readonly queue = new ConsumerQueue<IDiskLimitItem>(2048);
  private task: NodeJS.Timeout | null = null;
  private checking: boolean = false;
  private concurrent = 2;

  constructor() {
    this.task = setInterval(() => {
      this.#startCheck();
    }, 1000 * 10);
  }

  async checkInstanceDiskSize(instance: Instance) {
    const workspace = instance.absoluteCwdPath();
    const maxSpace = Number(instance.config.docker.maxSpace);
    this.queue.push({
      key: instance.instanceUuid,
      item: {
        instance,
        workspace,
        maxSpace
      }
    });
    this.#startCheck();
  }

  async #startCheck() {
    if (this.checking) return;
    this.checking = true;
    for (let i = 0; i < this.concurrent; i++) {
      const item = this.queue.pop();
      if (item) {
        this.checkDiskNow(item);
      }
    }
    this.checking = false;
  }

  async #stopInstance(instance: Instance) {
    if (instance.status() === Instance.STATUS_RUNNING) {
      const startCount = instance.startCount;
      instance.execPreset("stop");
      await sleep(1000 * 60);
      if (instance.status() === Instance.STATUS_RUNNING && startCount === instance.startCount) {
        instance.println("ERROR", $t("实例因为储存空间不足正常关闭超时，正在强制停止..."));
        instance
          .execPreset("kill")
          .then(() => {})
          .catch((err) => {});
      }
    }
  }

  public async checkDiskNow(item: IDiskLimitItem, autoStop: boolean = true) {
    const { instance, workspace, maxSpace } = item;
    // There was already an initial check on the working directory when saving,
    // but we double-check here.
    if (['"', "'", "`", "$"].some((ch) => workspace.includes(ch)) || !fs.existsSync(workspace)) {
      instance.info.storageUsage = -1;
      instance.info.storageLimit = maxSpace;
      return;
    }
    const command = `du -s --block-size=1M "${workspace}"`;
    const { stdout } = await execPromise(command);

    const diskUsageSizeMb = Number(String(stdout.split("/")[0]).replaceAll("\t", "").trim());

    if (isNaN(Number(diskUsageSizeMb))) {
      instance.info.storageUsage = 0;
      instance.info.storageLimit = convertGBToBytes(maxSpace); // GB to bytes
    } else {
      instance.info.storageUsage = diskUsageSizeMb * 1024 * 1024; // MB to bytes
      instance.info.storageLimit = convertGBToBytes(maxSpace); // GB to bytes
    }

    const storageLimit = instance.info.storageLimit;
    const storageUsage = instance.info.storageUsage;

    if (autoStop) {
      if (storageUsage >= storageLimit && storageLimit > 0) {
        for (let i = 0; i < 3; i++) {
          instance.println(
            "WARNING",
            $t("储存空间不足，您的储存额度为 {{storageLimit}}GB，当前已使用 {{storageUsage}}GB", {
              storageLimit: convertBytesToGB(storageLimit),
              storageUsage: convertBytesToGB(storageUsage)
            })
          );
          instance.println(
            "WARNING",
            $t("请在文件管理中删除多余文件，或联系管理员增加储存额度，否则将无法继续使用...!")
          );
          await sleep(200);
        }
        this.#stopInstance(instance);
      }
    }

    return {
      isFull: storageUsage >= storageLimit && storageLimit > 0,
      storageLimit: convertBytesToGB(storageLimit),
      storageUsage: convertBytesToGB(storageUsage)
    };
  }
}

export function convertBytesToGB(bytes: number) {
  return Number((bytes / 1024 / 1024 / 1024).toFixed(2));
}

export function convertGBToBytes(gb: number) {
  return Number((gb * 1024 * 1024 * 1024).toFixed(2));
}

export default new DiskLimitService();
